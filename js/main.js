let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(registration=> {
    console.log('[ServiceWorker] Service worker registered');
  }).catch(error=> {
    console.error('[ServiceWorker] Service worker registration failed', error);
  });
}
else {
  console.error('[ServiceWorker] Service worker not supported');
}

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
  
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  let imgSrc = DBHelper.imageUrlForRestaurant(restaurant);
    const image = document.createElement('img');
    image.className = 'restaurant-img';
    image.alt = `${restaurant.name} image`;
  if (imgSrc != "/img/undefined"){
    image.setAttribute('data-echo',imgSrc + '.jpg');
  }
  image.src = '/img/48.png';
    li.append(image);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  // console.log("favoroite", restaurant.id +" "+ restaurant.is_favorite);
  // const favoriteLable = document.createElement('label');
  // favoriteLable.setAttribute('for','is-favorite'+ restaurant.id);
  // favoriteLable.innerHTML = " Is Favorite? ";
  // const favoriteInput = document.createElement('input');
  // favoriteInput.setAttribute('type','checkbox');
  // favoriteInput.setAttribute('onchange',`toggleFavorite(this, ${restaurant.id})`);
  // favoriteInput.setAttribute('id','is-favorite'+ restaurant.id);
  // favoriteInput.setAttribute('value','is-favorite');
  // if (restaurant.is_favorite) {
  //   favoriteInput.setAttribute('checked','checked');
  // }
  // favoriteLable.append(favoriteInput);
  // li.append(favoriteLable);

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}

showMap = me=>{
  me.style.display = 'none';
  const map  = document.getElementById('map');
  map.style.display = 'block';
}

// toggleFavorite = (me, restaurant_id) => {
//   let xhr = new XMLHttpRequest();
//   xhr.open('POST', `http://localhost:1337/restaurants/${restaurant_id}/?is_favorite=${me.checked}`);
//   xhr.onload = () => {
//     if (xhr.status === 200) { 
//       DBHelper.fetchRestaurantById(restaurant_id, (error, restaurant) => {
//         self.restaurant = restaurant;
//       });
//       console.log("toggleFavorite yes ");
//     } else { 
//       console.log("toggleFavorite no ");
//     }
//   };
//   xhr.send();
// }