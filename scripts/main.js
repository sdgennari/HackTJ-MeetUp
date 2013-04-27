var map;
var geocoder;
var latLons;
var destination;        //Stored as a string with the address OR a latLon
var startAddress;
var addresses;
var addressCount;
var directionsDisplay;
var directionsService = new google.maps.DirectionsService();
var infowindow = new google.maps.InfoWindow();

function initialize() {
    var mapCanvas = $( "#map_canvas" );
	mapCanvas.width(mapCanvas.width()-250);
	mapCanvas.height(mapCanvas.height()-60);
    
    //Make the geocoder
    geocoder = new google.maps.Geocoder();

    //Make the directionsRenders
    directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers: true});
    
    //Make the map
    initMap();

    //Sample Addresses
    getLatLonFromAddresses();

    //Sample Directions
    calcDirections();
}


//Note: we control the keyword, so no checks necessary
function locationSearch(latLon, type, radius, keyword) {
    var typeArr = new Array();
    typeArr.push(type);
    
    var request = {
        location: latLon,
        radius: radius,
        keyword: keyword,
        types: typeArr
    };
      
    var service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, locationSearchCallback);
}

function addMarker(latLon, address, tooltip) {
    var image = new google.maps.MarkerImage(
        'http://i.imgur.com/3YJ8z.png',
        new google.maps.Size(19,25),    // size of the image
        new google.maps.Point(0,0), // origin, in this case top-left corner
        new google.maps.Point(9, 25)    // anchor, i.e. the point half-way along the bottom of the image
    );

    var addressTitle = address.substring(0, address.indexOf(",")) + "\n" + address.substring(address.indexOf(",")+2);

    var marker = new google.maps.Marker({
          map: map,
          icon: image,
          title: addressTitle,
          position: latLon
    });

    google.maps.event.addListener(marker, 'click', function(){
        startAddress = marker.getPosition();
        calcDirections();
    });

}

//TODO: Possible feature-- Direction TYPE
function calcDirections() {
    if(startAddress == null || startAddress == "")
        return;
    if(destination == null || destination == "")
        return;
    
    var request = {
        origin: startAddress,
        destination: destination,
        travelMode: google.maps.DirectionsTravelMode.DRIVING
    };
    directionsService.route(request, function(response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
        directionsDisplay.setDirections(response);
        }
    });
}

function getLatLonFromAddresses() {
    //Get addresses from UI
    addresses = new Array();
    latLons = new Array();
    
    //Sample data
    addresses.push("2000 Hayes Street, San Francisco, CA");
    addresses.push("958 Filbert Street, San Francisco, CA");
    addresses.push("1511 3rd St, San Francisco, CA");
    addresses.push("132 Starview Way, San Francisco, CA");
    

    var request;
    addressCount=addresses.length;
    //Convert addresses to latLons
    for(var i=0; i<addresses.length; i++) {
        geocoder.geocode({ 'address': addresses[i] }, function (results, status) {
            //THIS GETS CALLED AFTER GEOCODE
            if (status == google.maps.GeocoderStatus.OK) {
                //Get the latLon from the results
                latLons.push( results[0].geometry.location );
                addMarker( results[0].geometry.location, results[0].formatted_address, true );
                addressCount--;
                if(addressCount==0) {
                    calcCenter();
                }
            }
        });
    }
}

function calcCenter() {
    var totalLat = 0;
    var totalLon = 0;
    
    for(var i=0; i<latLons.length; i++) {
        totalLat = latLons[i].lat() + totalLat;
        totalLon = latLons[i].lng() + totalLon;
    }
    var midpoint = new google.maps.LatLng( (totalLat/latLons.length), (totalLon/latLons.length));

    //Set map center and draw circles
    map.setCenter(midpoint);

    var circle = new google.maps.Circle({
        map: map,
        center: midpoint,
        fillColor: "#00FF00",
        fillOpacity: 0.3,
        strokeColor: "#00FF00",

        strokeOpacity: 0.0,
        strokeWeight: 1,
        radius: (1600)
    });

    //-----
    locationSearch(midpoint, "restaurant", 1200, "cafe");
}

function initMap() {
    var latLon = new google.maps.LatLng(0.0, 0.0);
    var mapOptions = {
      center: latLon,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
    directionsDisplay.setMap(map);
}

function locationSearchCallback(results, status, pagination) {
      if (status != google.maps.places.PlacesServiceStatus.OK) {
        return;
      } else {
        createMarkers(results, true);

        if(pagination.hasNextPage) {
            sleep:2;
            pagination.nextPage();
        }
      }
}

function createMarkers(places, tooltip) {
      //var bounds = new google.maps.LatLngBounds();

      for (var i = 0, place; place = places[i]; i++) {
        
      
        var image = {
          url: place.icon,
          size: new google.maps.Size(25, 25),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(17, 34),
          scaledSize: new google.maps.Size(25, 25)
        };

        var marker = new google.maps.Marker({
          map: map,
          icon: image,
          title: place.name,
          position: place.geometry.location
        });

        
        if(tooltip) {
            var content = "<div>"+
                    "<span>"+place.name+"</span><br>"+
                    "<span>Rating: "+place.rating+"</span><br>"+
                    "<span id=\"popup-address\">"+place.vicinity+"</span><br>"+
                    "<div>Set as Destination? <input type=\"button\" value=\"yes\""+
                        "onClick=\"setDestFromPopup()\"></div>"
                    "</div>";
            
            google.maps.event.addListener(marker, 'click', (function(marker, content) {
                return function() {
                    infowindow.setContent(content);
                    infowindow.open(map, marker);
                }
            })(marker, content));

        }
        
        //bounds.extend(place.geometry.location);
      }
      //map.fitBounds(bounds);
}

function setDestFromPopup() {
    destination = $( "#popup-address" ).text();
    calcDirections();
}

function addAddress() {
    var address = $( "#address" ).val();
    var li = $( "<li class=\""+address+"\">"+address+"<input class=\"delete\" type=\"button\" onClick=\"removeAddress()\"></li>" );
    $( "#addresses" ).append(li);
	$( "#address" ).val("");

}

function removeAddress() {
    //Temporary safe measure against removing all addresses
    if(addresses.length <= 1) {
        return;
    }
    
    var address_id = $( this ).parent().find( ".address-id" ).text();

    //Remove the li from the ul
    $( this ).parent().remove();

    var i;
    for(i=0; i< addresses.length; i++) {
        if(addresses[i].id === address_id) {
            break;
        }
    }
    //Remove the address from the array
    addresses.splice(i,1);
}
