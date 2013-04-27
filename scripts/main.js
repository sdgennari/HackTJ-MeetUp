var map;
var geocoder;
var latLons = new Array();
var destination;        //Stored as a string with the address OR a latLon
var startAddress;
var addresses = new Array();
var addressCount;
var directionsDisplay;
var directionsService = new google.maps.DirectionsService();
var infowindow = new google.maps.InfoWindow();
var searchMarkerArray = new Array();        //needed to remove markers from map
var addressMarkerArray = new Array();        //needed to remove markers from map

var bounds = new google.maps.LatLngBounds();
var searchDetails ={ latLon: "", types: "", radius: "", keyword: "" };
var placeList = new Array();


/*Sample data
2000 Hayes Street, San Francisco, CA
958 Filbert Street, San Francisco, CA
1511 3rd St, San Francisco, CA
132 Starview Way, San Francisco, CA
*/

function initialize() {
    var mapCanvas = $( "#map_canvas" );
	mapCanvas.width(mapCanvas.width()-40);
	//mapCanvas.height(mapCanvas.height()-60);
    
    //Make the geocoder
    geocoder = new google.maps.Geocoder();

    //Make the directionsRenders
    directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers: true});
    
    //Make the map
    initMap();

    //Make the UI
    initUI();

    //Sample Addresses
    //getLatLonFromAddresses();

    //Sample Directions
    //calcDirections();
}

function initUI() {
    $("#left-hide").click(function() {
        $("#left-bar").hide("slide", 500);
    });

    $("#left-show").click(function() {
        $("#left-bar").show("slide", 500);
    });

    $("#right-hide").click(function() {
        $("#right-bar").hide("slide", {direction:"right"}, 500);
    });

    $("#right-show").click(function() {
        $("#right-bar").show("slide", {direction:"right"}, 500);
    });

    $("#meet-up").click(function() {
        getLatLonFromAddresses();
    });

    initTypeAutoComplete();

}

//Clear the current markers on the map
function clearAddressMarkers() {
    while(addressMarkerArray.length>0) {
        var marker = addressMarkerArray.pop();
        marker.setMap(null);
    }
}

//Clear the current markers on the map
function clearSearchMarkers() {
    while(searchMarkerArray.length>0) {
        var marker = searchMarkerArray.pop();
        marker.setMap(null);
    }
}

//Note: we control the keyword, so no checks necessary
function locationSearch() {
    clearSearchMarkers();
    var typeArr = new Array();

    if(searchDetails.types == "") {
        typeArr = placeList;
    }
    else {
        typeArr.push(searchDetails.types);
    }

    if(searchDetails.latLon == "") {
        return;
    }
    if(searchDetails.radius == "") {
        searchDetails.radius = 1600;
    }
    
    var request = {
        location: searchDetails.latLon,
        radius: (searchDetails.radius-400),
        keyword: searchDetails.keyword,
        types: typeArr
    };

    var circle = new google.maps.Circle({
        map: map,
        center: searchDetails.latLon,
        fillColor: "#72CCA7",
        fillOpacity: 0.5,
        strokeColor: "#72CCA7",

        strokeOpacity: 0.0,
        strokeWeight: 1,
        radius: (searchDetails.radius+400)
    });
    searchMarkerArray.push(circle);
      
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
    addressMarkerArray.push(marker);

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
            //Clear out previous directions
            var currentDirs = $( "#directions" ).children();
            for(var i=2; i<currentDirs.length; i++) {
                currentDirs[i].remove();
            }
            
            directionsDisplay.setDirections(response);
            //response.routes[0].legs[0].steps[0].instructions
            var steps = response.routes[0].legs[0].steps;
            var li = "";
            for(var i=0; i<steps.length; i++) {
                li = $("<li>"+steps[i].instructions+"</li>");
                $( "#directions" ).append(li);
            }
        }
    });
    $("#left-bar").show("slide", 500);
}

function getLatLonFromAddresses() {
    //Get addresses from UI
    addresses = new Array();
    latLons = new Array();
    
    //Get data from input fields
    var addressFields = $.find(".address-field");
    for(var i=0; i<addressFields.length; i++) {
        addresses.push( $( addressFields[i] ).text());
    }

    var request;
    addressCount=addresses.length;
    //Convert addresses to latLons
    for(var i=0; i<addresses.length; i++) {
        geocoder.geocode({ 'address': addresses[i] }, function (results, status) {
            //THIS GETS CALLED AFTER GEOCODE
            if (status == google.maps.GeocoderStatus.OK) {
                //Get the latLon from the results
                latLons.push( results[0].geometry.location );
                bounds.extend( results[0].geometry.location );
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

    //Set map center
    //map.setCenter(midpoint);
    map.fitBounds(bounds);
    $("#left-bar").hide("slide", 500);
    $("#right-bar").hide("slide", {direction:"right"}, 500);
    
    searchDetails.latLon = midpoint;
    //searchDetails.types = "restaurant";
    //searchDetails.radius = 1200;
    //searchDetails.keyword = "";
    locationSearch();
}

function initMap() {
    var latLon = new google.maps.LatLng(38.8900, -77.0300);
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
        searchMarkerArray.push(marker);

        if(tooltip) {
            var content = "<div class=\"tooltip-popup\">"+
                    "<span>"+place.name+"</span><br>"+
                    "<span>Rating: "+place.rating+"</span><br>"+
                    "<span id=\"popup-address\">"+place.vicinity+"</span><br>"+
                    "<div>Set as Destination? <input type=\"button\" value=\"yes\""+
                        "onClick=\"setDestFromPopup()\"></div>"+
                    "<div><a href=\"https://twitter.com/share?text="+encodeURIComponent("#meetUp at "+place.name+"! Address: "+place.vicinity+" #hackTJ")+"\" class=\"twitter-share-button\" target=\"_blank\" data-lang=\"en\"><img src=\"images/tweetbutton.png\" height=\"35px\" alt=\"Tweet\"></a></div>"
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
    infowindow.close();
    calcDirections();
}

function addAddress() {
    var address = $( "#address" ).val();
    if(address=="") {
        return;
    }
    
    var deleteButton = $( "<input class=\"delete\" type=\"button\">" );
    deleteButton.click(function() {
        var idx = -1;
        var li = $(this).parent();
        var children = li.parent().children();
        for(var i=0; i< li.parent.length; i++) {
            if( $(children[i]).text() == li.text()) {
                idx=i;
                break;
            }
        }
        addresses.splice(idx-1,1);
        li.remove();
    });
    
    var li = $( "<li class=\"address-field\">"+address+"</li>" );
    li.append(deleteButton);
    $( "#addresses" ).append(li);
	$( "#address" ).val("");
}

/*
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
}*/


function setRadius() {
    var rad = parseFloat($("#radius").val());
    if(rad == NaN) {
        return;
    }
    searchDetails.radius = rad*1600;
    locationSearch();
}

function setVenue() {
    var type = $("#venue").val();
    searchDetails.types = type;
    locationSearch();

}

function tweet(name, vicinity) {
	left = (screen.width/2)-290;
	top = (screen.height/2)-150;
	window.open("https://twitter.com/share?text="+encodeURIComponent("#meetUp at "+name+"! Address: "+vicinity+" #hackTJ"), '', 'height=300' + ', width=580' + ', top=' + top +', left=' + left + ', toolbar=0, location=0, menubar=0, directories=0, scrollbars=0');
}

function initTypeAutoComplete() {
    placeList = [
        "amusement_park",
        "aquarium",
        "art_gallery",
        "bakery",
        "bar",
        "bowling_alley",
        "bus_station",
        "cafe",
        "campground",
        "casino",
        "clothing_store",
        "convenience_store",
        "department_store",
        "electronics_store",
        //"establishment",
        "food",
        "furniture_store",
        "grocery_or_supermarket",
        "home_goods_store",
        "jewelry_store",
        "library",
        "lodging",
        "meal_delivery",
        "meal_takeaway",
        "movie_rental",
        "movie_theater",
        "museum",
        "night_club",
        "park",
        "restaurant",
        "school",
        "shoe_store",
        "shopping_mall",
        "spa",
        "stadium",
        "store",
        "subway_station",
        "taxi_stand",
        "train_station",
        "university",
        "zoo"];

        $("#venue").autocomplete({
            source: placeList,
            messages: {
                noResults: '',
                results: function() {
                }
            }
        });
}

