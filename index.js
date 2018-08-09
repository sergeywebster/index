class EventEmitter {
	constructor() {
		this.channels = {};
	}

	notify(eventName, args) {
		if (!this.channels[eventName]) {
			this.channels[eventName] = [];
		}
		this.channels[eventName].forEach(listener => listener(args));
	}

	on(eventName, callback) {
		if (!this.channels[eventName]) {
			this.channels[eventName] = [];
		}
		this.channels[eventName].push(callback);
	}
}

class FilterGroup extends EventEmitter {
	constructor(name, sort, options) {
		super();
		this.name = name;
		this.defaultOptions = options;
		this.sort = sort;
		this.group = document.querySelector(`[data-filter=${name}]`);

		this.value = { sort_by: this.sort.value };
		this.controls = {};

		this.channels = {};

		this._init();
	}

	createControls() {
		const controlsContainers = [...this.group.querySelectorAll('[id]')];
		controlsContainers.forEach(element => {
			const name = element.id;
			const type = element.dataset.controlType;
			const control = new FilterControl(element, name, type);

			this.addControl(name, control);
		})
	}

	initControls(options) {
		Object.keys(options).forEach(key => {
			const control = this.controls[key];
			if (control) {
				control.initControl(options[key]);
			}
		});
	}

	addControl(name, control) {
		this.controls[name] = control;
	}

	_mapValue(name, value) {
		if (name === 'prices') {
			const keys = Object.keys(value);
			keys.forEach(key => {
				const fieldName = this.name + '_' + key;
				this.value[fieldName] = value[key];
				if (!value[key]) {
					delete this.value[fieldName];
				}
			});
		} else {
			const fieldName = this.name + '_' + name;

			if (Array.isArray(value)) {
				if (value.length) {
					this.value[fieldName] = value.join(',');
				} else {
					delete this.value[fieldName];
				}
			} else {
				if (value) {
					this.value[fieldName] = value;
				} else {
					delete this.value[fieldName];
				}
			}
		}
	}

	toQueryString(value) {
		return Object.keys(value).map(key => `${key}=${value[key]}`).join('&');
	}

	reload(options) {
		Object.keys(this.controls).forEach(name => {
			this.controls[name].destroy()
				.then(() => delete this.controls[name]);
		});
		this.defaultOptions = options;
		this.createControls();
		this.initControls(this.defaultOptions);
		this._registerEvents();
	}

	_registerEvents() {
		Object.keys(this.controls).forEach(name => {
			const control = this.controls[name];

			control.on('change', () => {
				this._mapValue(control.name, control.value);
				this.notify('change', this.value);
			})
		});

		this.sort.on('change', val => {
			this.value.sort_by = val;
			this.notify('change', this.value);
		});
	}

	_init() {
		this.createControls();
		this.initControls(this.defaultOptions);
		this._registerEvents();
	}
}

class FilterControl extends EventEmitter {
	constructor(element, name, type) {
		super();
		this.container = element;
		this.name = name;
		this.type = type;
		this.value = null;

		this.inputs = [];

		this._init();
	}

	_getText(id, name) {
		if (this.name === 'line') {
			return `${id}-я линия`;
		}
		if (this.name === 'rating') {
			return `${id}+`;
		}
		if (this.name === 'stars') {
			if (id === 1) {
				return `1 звезда`
			} else if (id === 5 || id === 0) {
				return `${id} звезд`;
			} else {
				return `${id} звезды`;
			}
		}

		return name;
	}

	_createField(id, name) {
		const control = document.createElement('div');
		const label = document.createElement('label');
		const input = document.createElement('input');

		const text = this._getText(id, name);

		const labelText = document.createTextNode(text);

		control.className = this.type;

		input.name = this.name;
		input.type = this.type;
		input.value = id;

		label.appendChild(input);
		label.appendChild(labelText);

		control.appendChild(label);
		return control;
	}

	_appendFields(options) {
		const fragment = document.createDocumentFragment();
		options.forEach(opt => {
			const field = this._createField(opt.id, opt.name);
			field.addEventListener('change', this.listener.bind(this));
			fragment.appendChild(field);
		});
		this.container.appendChild(fragment);
		this.getInputs();
	}

	initControl(options) {
		if (this.type === 'radio' || this.type === 'checkbox') {
			if (this.name !== 'wifi') {
				this._appendFields(options);
			} else {
				const all = options.map(opt => opt.id);
				const free = all.filter(id => /FREE/.test(id));
				const exists = all.filter(id => !(/NONE/.test(id)));

				const wifiOptions = [
					{ name: 'Все отели', id: all.join(',') },
					{ name: 'Есть Wi-Fi', id: exists.join(',') },
					{ name: 'Бесплатный Wi-Fi', id: free.join(',') },
				];

				this._appendFields(wifiOptions);
			}
		}
	}

	get eventName() {
		if (this.type === 'checkbox' || this.type === 'radio') {
			return 'change';
		} else {
			return 'input';
		}
	}

	getInputs() {
		this.inputs = [...this.container.querySelectorAll('input')];
		return this.inputs;
	}

	patchValue(input) {
		if (this.type === 'checkbox') {
			this._patchCheckboxValue(input);
		} else if (this.type === 'range') {
			this._patchRangeValue(input);
		} else {
			this.value = input.value;
		}
	}

	_patchCheckboxValue(input) {
		if (!this.value) {
			this.value = [];
		}
		if (input.checked) {
			const valueAlreadyAdded = !!this.value.find(val => val === input.value);
			if (!valueAlreadyAdded) {
				return this.value.push(input.value);
			}
		} else {
			const addedValueIndex = this.value.findIndex(val => val === input.value);
			if (addedValueIndex > -1) {
				this.value.splice(addedValueIndex, 1);
			}
		}
	}

	_patchRangeValue(input) {
		if (!this.value) {
			this.value = {};
		}
		const key = `price_${input.name}`;
		this.value[key] = input.value;
	}

	destroy() {
		this.detachEvents();
		this.channels = {};
		this.inputs = [];
		while (this.container.querySelector('[data-breakpoint] + *')) {
			this.container.querySelector('[data-breakpoint] + *').remove();
		}
		this.container = null;
		return Promise.resolve(true);
	}

	listener(e) {
		this.patchValue(e.target);
		this.notify('change');
	}

	_registerEvents() {
		this.inputs.forEach(input =>
			input.addEventListener(this.eventName, this.listener.bind(this)));
	}

	detachEvents() {
		this.inputs.forEach(input =>
			input.removeEventListener(this.eventName, this.listener.bind(this)));
	}

	_init() {
		this.getInputs();
		this._registerEvents();

		setTimeout(() => this.detachEvents(), 2000);
	}
}

class Sort extends EventEmitter {
	constructor(name, options) {
		super();
		this.host = document.querySelector(`[data-sort=${name}]`);

		this.value = options.value;

		this._init();
	}

	listener(e) {
		if (e.target.tagName.toLowerCase() !== 'button') {
			return;
		}

		const targetData = e.target.dataset.sort.split(':');
		const field = targetData[0];
		const action = targetData[1];

		const currentValue = this.value.split(',');
		const currentField = currentValue[0];
		const currentAction = currentValue[1];

		if (action === 'reverse') {
			if (currentField === field) {
				this.value = `${field},${currentAction === 'asc' ? 'desc' : 'asc'}`;
			} else {
				this.value = `${field},asc`;
			}
		} else {
			this.value = `${field},${action}`;
		}
		this.notify('change', this.value);
	}

	detachListeners() {
		this.host.removeEventListener('click', this.listener.bind(this));
	}

	_registerEvents() {
		this.host.addEventListener('click', this.listener.bind(this));
	}

	_init() {
		this._registerEvents();
	}
}

class Catalog {
	constructor(root, data) {
		this.root = root;
		this.data = data;

		this.render({sort_by: 'price,asc'});
	}

	setData(data) {
		this.data = data;
	}

	getData() {
		return this.data;
	}

	createCart(item) {
		const li = document.createElement('li');
		const container = document.createElement('div');
		const img = document.createElement('img');
		const discount = document.createElement('div');
		const name = document.createElement('p');
		const city = document.createElement('span');
		const data = document.createElement('div');
		const distance = document.createElement('p');
		const price = document.createElement('p');

		// Setting attributes
		li.className = 'col-md-4';
		container.className = 'item';
		img.className = '-block';
		img.src = item.hotel.images[0]['x245x240'];
		img.alt = item.name;
		discount.className = 'item-label';
		name.className = 'text';
		city.className = '-small -a50';
		data.className = 'item-data -flex -align-center -jc-sp';
		distance.className = 'info-text -a50';
		price.className = 'info-text -big';

		// Text nodes
		const textName = document.createTextNode(item.hotel.name);
		const textCity = document.createTextNode(` (${item.hotel.city})`);
		const textDistance = item.hotel.features.beach_distance ? document.createTextNode(`До моря: ${item.hotel.features.beach_distance} м`) : null;
		const textPrice = document.createTextNode(`${item.min_price} руб.`);

		const discountAmount = item.extras.previous_price ?
			((item.extras.previous_price - item.min_price) / item.extras.previous_price * 100).toFixed():
			'5';
		const textDiscount = document.createTextNode(`-${discountAmount || 5}%`);

		// Appending text
		name.appendChild(textName);
		city.appendChild(textCity);
		textDistance && distance.appendChild(textDistance);
		price.appendChild(textPrice);
		discount.appendChild(textDiscount);

		// Appenging elements
		name.appendChild(city);

		textDistance && data.appendChild(distance);
		data.appendChild(price);

		container.appendChild(img);
		container.appendChild(name);
		container.appendChild(data);
		container.appendChild(discount);

		li.appendChild(container);
		return li;
	}

	clear() {
		while (this.root.querySelector('li')) {
			this.root.querySelector('li').remove();
		}
	}

	render(filter) {
		this.clear();
		const filteredData = this.filter(filter);
		const fragment = document.createDocumentFragment();
		filteredData.forEach(item => {
			fragment.appendChild(this.createCart(item));
		});
		this.root.appendChild(fragment);
	}

	filter(filter) {
		return this.data.filter(item => {
			if (filter.filter_hotel_name) {
				const re = new RegExp(filter.filter_hotel_name, 'i');
				const passes = re.test(item.hotel.name.toLowerCase());
				if (!passes) {
					return false;
				}
			}
			if (filter.filter_rating) {
				if (item.hotel.rating < +filter.filter_rating) {
					return false;
				}
			}
			if (filter.filter_stars) {
				const stars = filter.filter_stars.split(',');
				if (stars.indexOf('' + item.hotel.stars) === -1) {
					return false;
				}
			}
			if (filter.filter_price_min) {
				if (+filter.filter_price_min > item.min_price) {
					return false;
				}
			}
			if (filter.filter_price_max) {
				if (+filter.filter_price_max < item.min_price) {
					return false;
				}
			}
			if (filter.filter_line) {
				const lines = filter.filter_line.split(',');
				if (lines.indexOf('' + item.hotel.features.line) === -1) {
					return false;
				}
			}
			if (filter.filter_meals) {
				const meals = filter.filter_meals.split(',');
				const pansions = Object.keys(item.pansion_prices);
				if (!meals.some(meal => pansions.indexOf(meal) > -1)) {
					return false;
				}
			}
			if (filter.filter_operators) {
				const operators = filter.filter_operators.split(',');
				if (!operators.some(operator => item.operators.indexOf(+operator) > -1)) {
					return false;
				}
			}
			if (filter.filter_wifi) {
				const wifi = filter.filter_wifi.split(',');
				if (wifi.indexOf(item.hotel.features.wi_fi) === -1) {
					return false;
				}
			}

			return true;
		}).sort((a, b) => {
			if (filter.sort_by === 'price,asc') {
				if (a.min_price < b.min_price) {
					return -1;
				}
				if (a.min_price > b.min_price) {
					return 1;
				}
				return 0;
			}
			if (filter.sort_by === 'price,desc') {
				if (a.min_price > b.min_price) {
					return -1;
				}
				if (a.min_price < b.min_price) {
					return 1;
				}
				return 0;
			}
			if (filter.sort_by === 'rating,desc') {
				if (a.hotel.rating > b.hotel.rating) {
					return -1;
				}
				if (a.hotel.rating < b.hotel.rating) {
					return 1;
				}
				return 0;
			}
		});
	}
}

const sort = new Sort('host', { value: 'price,asc' });
const group = new FilterGroup('filter', sort, {});
const catalog = new Catalog(document.querySelector('.list-item'), []);

function request(method, url, query, body) {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		if (query) {
			url = `${url}?${query}`;
		}

		xhr.open(method, url, true);
		xhr.onreadystatechange = function () {
			if (xhr.readyState === XMLHttpRequest.DONE) {
				if (xhr.status === 200) {
					resolve(xhr.response);
				} else {
					reject(xhr.response);
				}
			}
		};
		if (method === 'POST') {
			xhr.send(body);
		} else {
			xhr.send();
		}
	});
}

request('GET', 'get_data.php')
	.then(response => {
		const data = JSON.parse(response);
		catalog.data = data.hotels;
		catalog.render(group.value);
		group.reload(data.filters);
	})
	.catch(error => console.log(error));

group.on('change', v => {
	// Каждое изменение фильтра должно отправлять запрос на бэкенд
	// Хорошей практикой будет поставить debounce на изменения https://davidwalsh.name/javascript-debounce-function
    /*
	request('GET', 'filter.php', group.toQueryString(v))
		.then(response => {
			const data = JSON.parse(response);

			catalog.data = data.hotels;
			catalog.render(group.value);
		})
		.catch(error => console.log(error));
	*/
	catalog.render(v);	
});

