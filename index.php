<?php
    echo '
        <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <title>Tour Filter</title>
                <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">
                <link rel="stylesheet" href="index.css">
            </head>
            <body>
                <main class="wrapper row">
                    <aside id="filter" class="col-md-3 filter" data-filter="filter">
                        <div class="form-group" id="hotel_name" data-control-type="text">
                            <label>
                                Поиск по названию отеля
                                <input class="form-control -block" type="text" name="hotel_name" placeholder="Four Seasons">
                            </label>
                        </div>
                        <div class="form-inline -mb15" id="prices" data-control-type="range">
                            <label class="-block">Цена</label>
                            <div class="form-group">
                                <span>от</span> <input class="form-control -w50" type="number" name="min" step="500">
                            </div>
                            <div class="form-group -mt10">
                                <span>до</span> <input class="form-control -w50" type="number" name="max" step="500">
                            </div>
                        </div>
                        <div class="form-group" id="stars" data-control-type="checkbox">
                            <label>Звездность</label>
                            <span hidden data-breakpoint></span>
                        </div>
                        <div class="form-group" id="rating" data-control-type="radio">
                            <label>Рейтинг</label>
                            <div class="radio">
                                <label>
                                    <input type="radio" name="rating" value=""> Любой
                                </label>
                            </div>
                            <span hidden data-breakpoint></span>
                        </div>
                        <div class="form-group" id="line" data-control-type="checkbox">
                            <label>Расстояние до моря</label>
                            <span hidden data-breakpoint></span>
                        </div>
                        <div class="form-group" id="meals" data-control-type="checkbox">
                            <label>Питание</label>
                            <span hidden data-breakpoint></span>
                        </div>
                        <div class="form-group -dynamic" id="regions" data-control-type="checkbox">
                            <label>Регион</label>
                            <span hidden data-breakpoint></span>
                        </div>
                        <div class="form-group" id="wifi" data-control-type="radio">
                            <label>Wi-Fi</label>
                            <span hidden data-breakpoint></span>
                        </div>
                        <div class="form-group" id="operators" data-control-type="checkbox">
                            <label>Туроператор</label>
                            <span hidden data-breakpoint></span>
                        </div>
                    </aside>
                    <section id="catalog" class="col-md-9 catalog">
                        <div class="row header-row">
                            <div class="col-md-6 -flex" data-sort="host">
                                <button class="btn btn-default" type="button" data-sort="price:reverse">По цене</button>
                                <button class="btn btn-default" type="button" data-sort="rating:desc">По рейтингу</button>
                            </div>
                        </div>
                        <ul class="row list-item">
                            
                        </ul>
                    </section>
                </main>
                <script src="index.js"></script>
            </body>
        </html>
    ';