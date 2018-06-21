let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const isfavorite = document.getElementById('is-favorite');
  isfavorite.checked = restaurant.is_favorite;
  // console.log("is favorite", restaurant.is_favorite);

  let imgSrc = DBHelper.imageUrlForRestaurant(restaurant);
  if (imgSrc != "/img/undefined"){
    const image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img';
    image.alt = `${restaurant.name} image`;
    image.setAttribute('data-echo',imgSrc + '.jpg');
    image.src = '/img/48.png';
  }

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  checkOfflineReviews();
  fillreviews();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews) => {
  // fetch(`http://localhost:1337/reviews/?restaurant_id=${self.restaurant.id}`)
  //   .then(response=> {reviews = response.json(); console.log("Review response ", response)})
  //   .catch(()=>{console.log("It Failed")});
  
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li'); 
  const div = document.createElement('div');
  div.className = "review-info";
  const name = document.createElement('p');
  name.className = "review-name";
  name.innerHTML = review.name;
  div.appendChild(name);

  const date = document.createElement('p');
  date.className = "review-date";
  date.innerHTML = new Date(review.createdAt).toDateString();;
  div.appendChild(date);
  li.appendChild(div);

  const rating = document.createElement('p');
  rating.className = "rating";
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

toggleFavorite = (me) => {
  let xhr = new XMLHttpRequest();
  xhr.open('PUT', `${DBHelper.DATABASE_URL}restaurants/${self.restaurant.id}/?is_favorite=${me.checked}`);
  xhr.onload = () => {
    if (xhr.status === 200) { 
      DBHelper.fetchRestaurantById(self.restaurant.id, (error, restaurant) => {
        self.restaurant = restaurant;
      });
    } else { 
      console.log("toggleFavorite error ");
    }
  };
  xhr.send();
}

fillreviews = () => {
  if (navigator.onLine) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', `${DBHelper.DATABASE_URL}reviews/?restaurant_id=${self.restaurant.id}`);
    xhr.onload = () => {
      // console.log("Status ", xhr.status);
      if (xhr.status === 200) { // Got a success response from server!
        fillReviewsHTML(JSON.parse(xhr.responseText));
        DBHelper.dbOpenUpdate(JSON.parse(xhr.responseText), 'reviews', self.restaurant.id);
        // console.log("reviews ", xhr.responseText);
        return;
      } else { // Oops!. Got an error from server.
        const error = (`Request failed. Returned status of ${xhr.status}`);
        fillReviewsHTML(self.restaurant.reviews);
      }
    };
    xhr.addEventListener("error", transferFailed);
    xhr.send();
  } else {
    DBHelper.dbGet((error, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        // const review = Array.from(reviews).filter(r => r.restaurant_id == self.restaurant.id);
        if (reviews) { 
          fillReviewsHTML(reviews)
        } else { 
          fillReviewsHTML(self.restaurant.reviews);
        }
      }
    }, 'reviews', self.restaurant.id);
  }
}

addReview = () => {
  // const reviewer_name = document.getElementById('reviewer_name');
  // const rating = document.getElementById('rating');
  // const comment_text = document.getElementById('comment_text');
  if (navigator.onLine) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', `${DBHelper.DATABASE_URL}reviews/`);
    xhr.onload = () => {
      if (xhr.status === 201) { 
        //fillreviews();
        fillReviewsHTML([{comments:comment_text.value, createdAt: new Date(), name: reviewer_name.value, rating: rating.value}]);
        review_form.reset();
      } else { 
        console.log("toggleFavorite error ");
      }
    };
    xhr.addEventListener("error", transferFailed);
    xhr.send(JSON.stringify({ restaurant_id: self.restaurant.id, name: reviewer_name.value, rating: rating.value, comments: comment_text.value }));
  }else {
    DBHelper.dbOpenUpdate(JSON.stringify({ restaurant_id: self.restaurant.id, name: reviewer_name.value, rating: rating.value, comments: comment_text.value }), 'reviews_temp', 0);
    fillReviewsHTML([{comments:comment_text.value, createdAt: new Date(), name: reviewer_name.value, rating: rating.value}]);
    review_form.reset();
    localStorage.setItem('hasOfflineReview', true);
    alert('Message will be sent once device goes online!');
  }
}

transferFailed = (evt) => {
  console.error("error sending new data ", evt);
}

checkOfflineReviews = ()=> {
  if (navigator.onLine && localStorage.getItem('hasOfflineReview')) {
    DBHelper.dbGet((error, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        if (reviews) { 
          reviews.forEach(review => {
            let xhr = new XMLHttpRequest();
            // console.log(review.reviews);
            const data = JSON.parse(review.reviews)
            xhr.open('POST', `${DBHelper.DATABASE_URL}reviews/`);
            xhr.onload = () => {
              if (xhr.status === 201) { 
              } else { 
                console.log("sending offline data error ");
              }
            };
            xhr.send(JSON.stringify({ restaurant_id: data.restaurant_id, name: data.name, rating: data.rating, comments: data.comments }));
          });
          localStorage.setItem('hasOfflineReview', false);
        } 
      }
    }, 'reviews_temp', 0);
  }
}
