export function debounce(fn, delay) {
  var timeoutID = null;
  return function () {
    clearTimeout(timeoutID);
    var args = arguments;
    var that = this;
    timeoutID = setTimeout(function () {
      fn.apply(that, args);
    }, delay);
  };
}

export function differenceByDays(date_1, date_2) {
  let difference = date_1.getTime() - date_2.getTime();
  let TotalDays = Math.floor(difference / (1000 * 3600 * 24));
  return TotalDays;
}
