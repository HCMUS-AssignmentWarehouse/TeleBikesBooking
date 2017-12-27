import firebase from 'firebase';
import router from '@/router';


var driverList = [];
var markers = [];
var isbusy = false;
var isFirstTime = true;
var notLocationBookingDealList = [];
var map = null;
var marker = null;

 // Sets the map on all markers in the array.
 function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
    }
  }

  // Removes the markers from the map, but keeps them in the array.
  function clearMarkers() {
    setMapOnAll(null);
  }

  var rad = function(x) {
    return x * Math.PI / 180;
  };

  var getDistance = function(lat1,long1,lat2, long2) {
    var R = 6378137; // Earth’s mean radius in meter
    var dLat = rad(lat2 - lat1);
    var dLong = rad(long2 - long1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rad(lat1)) * Math.cos(rad(lat2)) *
      Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d; // returns the distance in meter
  };

function findDriver(snapshot, geocoder, resultsMap, infowindow, radius, lat, long, _vehicle){
    clearMarkers();
    driverList = [];
    //var markers = [];
    snapshot.forEach(driver => {
        if (driver.val().state =="available" && driver.val().type == _vehicle){
            var currLat = parseFloat(driver.val().lat);
            var currLong = parseFloat(driver.val().long);

            lat = parseFloat(lat);
            long = parseFloat(long);

            var m = getDistance(lat,long,currLat,currLong);
            if (m <= radius){

                var driverPoint = {
                    driver: driver.val(),
                    distance: m                       
                }
                driverList.push(driverPoint);
                
            }

        }
            
    });

    
    //sap xep mang những chuyến xe nằm trong bán kính, đang available và thuộc loại xe mà khách hàng yêu cầu
    if (driverList.length > 0){
        for (var i = 0 ; i< driverList.length -1 ; i++ ){
            for (var j = i+1 ; j< driverList.length ; j++ ){
                if (driverList[i].distance > driverList[j].distance){
                    var temp = driverList[i];
                    driverList[i] =  driverList[j];
                    driverList[j] = temp;
                }
            }
        }
            
        // hiện 10 xe gần nhất
        for (var i = 0 ; i< 10 ; i++ ){
            if (i < driverList.length){
                var marker = new google.maps.Marker({
                    position: new google.maps.LatLng(driverList[i].driver.lat, driverList[i].driver.long),
                    map: resultsMap,
                    icon: "http://imageshack.com/a/img924/5672/1XsvZH.png"                                    
                });
    
                markers.push(marker);
            }
            
        }
    }
    
}

function getTenClosetDrivers(geocoder, resultsMap, infowindow, radius, lat, long, _vehicle){

    var database = firebase.database().ref('driver-list');

    database.once("value", function(snapshot) {
      console.log("**************************")
        findDriver(snapshot, geocoder, resultsMap, infowindow, 1000, lat, long, _vehicle);

        // if (driverList.length == 0){
        //     findDriver(snapshot, geocoder, resultsMap, infowindow, 600, lat, long, _vehicle);            
        // }
        // if (driverList.length == 0){
        //     findDriver(snapshot, geocoder, resultsMap, infowindow, 1000, lat, long, _vehicle);            
        // }
        if (driverList.length == 0){
            alert("KHÔNG CÓ XE");
        }
    });    
}

function onCancelClicked(){
    notLocationBookingDealList.splice(0, 1);

   if (notLocationBookingDealList.length > 0){
        var val = notLocationBookingDealList[0].val();
        var message = "New book deal: "+ val.address;
        if (confirm(message)) {
            isbusy = true;                    
            // Save it!
            var _data = val;            
            var currentKey = notLocationBookingDealList[0].key;
            document.getElementById("address").value = val.address;
            document.getElementById("vehicle").value = val.vehicle;
            document.getElementById("key").value = notLocationBookingDealList[0].key;
            document.getElementById("phone").value = val.phoneNumber;
            document.getElementById("note").value = val.note;
            var geocoder = new google.maps.Geocoder();
            var reverse = new google.maps.Geocoder();
            var infowindow = new google.maps.InfoWindow;
            marker = new google.maps.Marker(
            {
                position: { lat: -34.397, lng: 150.644 }
            });
                    
            //Call geo coding function
            geocodeAddress(geocoder, map, infowindow).lat();
                        
        } else {
                        // Do nothing!
        }
   }
}

function onOkClicked(){

    var database = firebase.database().ref('book-list');    
    
    var _address = document.getElementById("address").value;
    var _lat = document.getElementById("lat").value;

    var _long = document.getElementById("long").value;
    var _vehicle = document.getElementById("vehicle").value;
    var currentKey = document.getElementById("key").value;
    var _phoneNumber = document.getElementById("phone").value;
    var _note = document.getElementById("note").value;
            
    if (_lat = "" || _long == "" || currentKey ==""){
        alert("No booking-deal is located!");
    }else{

        notLocationBookingDealList.splice(0, 1);
        
        var postData = {
            phoneNumber: _phoneNumber,
            address: _address,
            lat: document.getElementById("lat").value,
            long:  _long,
            vehicle: _vehicle,
            state: "finding",
            note: _note
        };
  
        // Write the new post's data simultaneously in the posts list and the user's post list.
        var updates = {};
        updates['/' + currentKey] = postData;
        database.update(updates);
        alert("Book success! Finding driver...");
       if (notLocationBookingDealList.length > 0){
            var val = notLocationBookingDealList[0].val();
            var message = "New book deal: "+ val.address;
            if (confirm(message)) {
                isbusy = true;                    
                // Save it!
                var _data = val;            
                var currentKey = notLocationBookingDealList[0].key;
                document.getElementById("address").value = val.address;
                document.getElementById("vehicle").value = val.vehicle;
                document.getElementById("key").value = notLocationBookingDealList[0].key;
                document.getElementById("phone").value = val.phoneNumber;
                document.getElementById("note").value = val.note;
                var geocoder = new google.maps.Geocoder();
                var reverse = new google.maps.Geocoder();
                var infowindow = new google.maps.InfoWindow;
                marker = new google.maps.Marker(
                {
                    position: { lat: -34.397, lng: 150.644 }
                });
                        
                //Call geo coding function
                geocodeAddress(geocoder, map, infowindow).lat();
                            
            } else {

                onCancelClicked();
                            // Do nothing!
            }
       }
       
       isbusy = false;
    }
}

function reverseLocation(location, geocoder, infowindow) {
    geocoder.geocode({'location': location }, function(results, status) {
        if (status === 'OK') {
            if (results[0]) {
            //   map.setZoom(8);
                document.getElementById('address').value = results[0].formatted_address;
                document.getElementById('lat').value = location.lat();
                document.getElementById('long').value = location.lng();

                marker.setPosition(location);
                marker.setMap(map);
                // infowindow.setContent(results[0].formatted_address);
                // infowindow.open(map, marker);

                var _address = results[0].formatted_address;
                var _lat = location.lat();
                var _long = location.lng();
                var _vehicle = document.getElementById("vehicle").value;
        
                getTenClosetDrivers(geocoder, map, infowindow, 300, _lat, _long, _vehicle);
            } else {
                window.alert('Not found!');
            }
        } else {
            window.alert('Geocoder failed due to: ' + status);
        }
    });
}


function geocodeAddress(geocoder, resultsMap, infowindow) {
    var address = document.getElementById('address').value;
   
    //marker.setMap(map);
    geocoder.geocode({ 'address': address }, function(results, status) {
        if (status === 'OK') {
          console.log('OK');
            document.getElementById("lat").value = results[0].geometry.location.lat();
            document.getElementById("long").value = results[0].geometry.location.lng();
            resultsMap.setCenter(results[0].geometry.location);
            
            marker.setPosition(results[0].geometry.location);
            marker.setMap(resultsMap);
            //console.log(results[0]);
            //infowindow.setContent(results[0].formatted_address);
            //infowindow.open(resultsMap, pin); 

            var _address = document.getElementById("address").value;
            var _lat = document.getElementById("lat").value;
            var _long = document.getElementById("long").value;
            var _vehicle = document.getElementById("vehicle").value;
    
            getTenClosetDrivers(geocoder, resultsMap, infowindow, 300, _lat, _long, _vehicle);
          

        } else {
            console.log('FAILED');
            alert('Not found:  ' + status);
        }
    });
}


export const actions = {
  userSignUp ({commit}, payload) {
    commit('setLoading', true)
    firebase.auth().createUserWithEmailAndPassword(payload.email, payload.password)
    .then(firebaseUser => {
      commit('setUser', firebaseUser)
      commit('setLoading', false)
      commit('setError', null)
      router.push('/home')
    })
    .catch(error => {
      commit('setError', error.message)
      commit('setLoading', false)
    })
  },
  userSignIn ({commit}, payload) {
    commit('setLoading', true)
    firebase.auth().signInWithEmailAndPassword(payload.email, payload.password)
    .then(firebaseUser => {
      commit('setUser', firebaseUser)
      commit('setLoading', false)
      commit('setError', null)
      router.push('/home')
    })
    .catch(error => {
      commit('setError', error.message)
      commit('setLoading', false)
    })
  },
  autoSignIn ({commit}, payload) {
    commit('setUser', payload)
  },
  userSignOut ({commit}) {
    firebase.auth().signOut()
    commit('setUser', null)
    router.push('/')
  },
  getCurrentBookingDeal({commit},payload){
     marker = new google.maps.Marker(
    {
        position: { lat: -34.397, lng: 150.644 }
    });
    map = payload.map;
    var reverse = new google.maps.Geocoder();
    var infowindow = new google.maps.InfoWindow;

    //Get location on click 
    google.maps.event.addListener(map, 'click', function(event) {
        reverseLocation(event.latLng, reverse, infowindow);
    });


    var setAddedMessage = function (data) {
        var val = data.val();
        //alert(notLocationBookingDealList.length);
        if (val.state == "not location"){           

            notLocationBookingDealList.push(data);

            if (notLocationBookingDealList.length == 1){
                var val = notLocationBookingDealList[0].val();
                var message = "New book deal: "+ val.address;
                if (confirm(message)) {
                    isbusy = true;     
                    isFirstTime = false;                   
                    // Save it!             
                    document.getElementById("address").value = val.address;
                    document.getElementById("vehicle").value = val.vehicle;
                    document.getElementById("key").value = data.key;
                    document.getElementById("phone").value = val.phoneNumber;
                    document.getElementById("note").value = val.note;       
                    commit('setCurrentBookingDeal',notLocationBookingDealList[0])

                    var geocoder = new google.maps.Geocoder();
                    
                   
                    //Call geo coding function
                    geocodeAddress(geocoder, map, infowindow).lat();           
                    
                                
                } else {

                    onCancelClicked();
                                // Do nothing!
                }

            }
        }               
    }

   
    var database = firebase.database().ref('book-list');  

    database.on('child_added',setAddedMessage);
    database.on('child_changed',setChangedMessage);

  },
  onOkClick({commit}){
    var database = firebase.database().ref('book-list');    
    
    var _address = document.getElementById("address").value;
    var _lat = document.getElementById("lat").value;

    var _long = document.getElementById("long").value;
    var _vehicle = document.getElementById("vehicle").value;
    var currentKey = document.getElementById("key").value;
    var _phoneNumber = document.getElementById("phone").value;
    var _note = document.getElementById("note").value;
            
    if (_lat = "" || _long == "" || currentKey ==""){
        alert("No booking-deal is located!");
    }else{

        notLocationBookingDealList.splice(0, 1);
        
        var postData = {
            phoneNumber: _phoneNumber,
            address: _address,
            lat: document.getElementById("lat").value,
            long:  _long,
            vehicle: _vehicle,
            state: "finding",
            note: _note
        };
  
        // Write the new post's data simultaneously in the posts list and the user's post list.
        var updates = {};
        updates['/' + currentKey] = postData;
        database.update(updates);
        alert("Book success! Finding driver...");
       if (notLocationBookingDealList.length > 0){
            var val = notLocationBookingDealList[0].val();
            var message = "New book deal: "+ val.address;
            if (confirm(message)) {
                isbusy = true;                    
                // Save it!
                var _data = val;            
                var currentKey = notLocationBookingDealList[0].key;
                document.getElementById("address").value = val.address;
                document.getElementById("vehicle").value = val.vehicle;
                document.getElementById("key").value = notLocationBookingDealList[0].key;
                document.getElementById("phone").value = val.phoneNumber;
                document.getElementById("note").value = val.note;
                var geocoder = new google.maps.Geocoder();
                var reverse = new google.maps.Geocoder();
                var infowindow = new google.maps.InfoWindow;
               
                commit('setCurrentBookingDeal',notLocationBookingDealList[0])
                        
                //Call geo coding function
                geocodeAddress(geocoder, map, infowindow).lat();
                            
            } else {

                onCancelClicked();
                            // Do nothing!
            }
       }
       
       isbusy = false;
    }
  },
  onCancelClick(){
    onCancelClicked();
  },
  geocoding(){
    var geocoder = new google.maps.Geocoder();
    var infowindow = new google.maps.InfoWindow;
                                       
    //Call geo coding function
    geocodeAddress(geocoder, map, infowindow).lat();
  }

}