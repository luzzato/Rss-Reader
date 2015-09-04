// Полизаполнение для поддержки Function.prototype.bind() на Android 2.3
(function () {
    if (!Function.prototype.bind) {
        Function.prototype.bind = function (thisValue) {
            if (typeof this !== "function") {
                throw new TypeError(this + " cannot be bound as it is not a function");
            }

            // bind() также разрешает добавлять аргументы в начало вызова
            var preArgs = Array.prototype.slice.call(arguments, 1);

            // Фактическая функция для привязки значения "this" и аргументов к
            var functionToBind = this;
            var noOpFunction = function () { };

            // Используемый аргумент "this"
            var thisArg = this instanceof noOpFunction && thisValue ? this : thisValue;

            // Результирующая функция привязки
            var boundFunction = function () {
                return functionToBind.apply(thisArg, preArgs.concat(Array.prototype.slice.call(arguments)));
            };

            noOpFunction.prototype = this.prototype;
            boundFunction.prototype = new noOpFunction();

            return boundFunction;
        };
    }
}());
