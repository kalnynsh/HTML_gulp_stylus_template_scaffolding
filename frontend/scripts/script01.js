"use strict";

(function($) {
  $(document).ready(function() {
    var TOWNS_URL = "json/towns.json";
    // var ACTIVE = "active";

    var townsArray;

    $.getJSON(TOWNS_URL, function(data) {
      $.each(data, function(i, town) {
        $("#towns-list").append(town + "<br>");
      });
    }).fail(function() {
      console.log("Fail to load JSON`s Towns List");
    });

    $("#date-pickerID").datepicker({
      monthNames: [
        "Январь",
        "Февраль",
        "Март",
        "Апрель",
        "Май",
        "Июнь",
        "Июль",
        "Август",
        "Сентябрь",
        "Октябрь"
      ],
      dayNamesMin: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
      firstDay: 1,
      dateFormat: "dd.mm.yy"
    });

    //
  });
})(jQuery);
