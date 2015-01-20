/**
 * Welcome to my Bike APP for pebble!
 */

var UI = require('ui');
var Vector2 = require('vector2'); 
var ajax = require('ajax');


var locationOptions = {'timeout': 15000, 'maximumAge': 30000,
                       'enableHighAccuracy': true};


function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

var main_window = new UI.Window();
var info_text = new UI.Text({
  position: new Vector2(0, 30),
  size: new Vector2(144, 40),
  text:'Fetching nearby stops...',
  textOverflow:'wrap',
  textAlign:'center'
});

function locationSuccess(pos) {
  console.log(JSON.stringify(pos.coords));
  fetchStops(pos.coords);
}

function locationError(err) {
  console.warn('location error (' + err.code + '): ' + err.message);
  info_text.text('Can\'t get location.');
}

function fetchStops(coords) {
  ajax({
    url: '',
    type: 'json'
  }, function(dataObj) {
    var data;
    if (dataObj.network.stations) {
      data = dataObj.network.stations;
    } else {
      info_text.text('Can\'t get location.');
    }
    var stops = [];
    var limit_stops = data.length;
    for (var i = 0; i < limit_stops; ++i) {
      var dataItem = data[i];
      var item = {
        title: dataItem.name,
        subtitle:  'Availables: ' + dataItem.free_bikes + '/' +  dataItem.extra.slots,
        stop: {
          name: dataItem.name,
          slots: dataItem.extra.slots,
          empty_slots: dataItem.empty_slots,
          free_bikes: dataItem.free_bikes,
          distance: getDistanceFromLatLonInKm(coords.latitude, coords.longitude,dataItem.latitude,dataItem.longitude)
          }
      };
      stops.push(item);
    }
    stops = stops.sort(function(a,b){return a.stop.distance - b.stop.distance;});
    var stopMenu = new UI.Menu({
      sections: [{
        items: stops
      }]
    });
        
    stopMenu.on('select', function(e) {
      var stop = e.item.stop;
      var bikeCard = new UI.Card({
        title: stop.name,
        body: ' Slots: ' + stop.slots + '\n Empty slots: ' + 
        stop.empty_slots + '\n Free bikes: ' + stop.free_bikes + '\n Distance: ' +
        stop.distance.toFixed(2),
        scrollable: true
      });
      bikeCard.show();
    });
    stopMenu.show();
    main_window.hide();
  }, function(error) {
    if (error.message) {
      info_text.text(error.message);
    } else {
      info_text.text('Connection Error');
    }
  });  
}

function init() {
  window.navigator.geolocation.getCurrentPosition(locationSuccess,
                                                  locationError,
                                                  locationOptions);
}

main_window.add(info_text);
main_window.show();
init();
