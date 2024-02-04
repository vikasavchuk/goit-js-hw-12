
import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';

import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

import axios from 'axios';

const modalLightboxGallery = new SimpleLightbox('.photo-container a', {
  captionsData: 'alt',
  captionDelay: 250,
});

const searchForm = document.querySelector('.search-form');
const photoListEl = document.querySelector('.photo-list');
const loadMoreBtn = document.querySelector('[data-action="load-more"]');
const loader = document.querySelector('.loader');
const loaderLoadMore = document.querySelector('.loader-load-more');

const hiddenClass = 'is-hidden';

let query = '';
let page = 1;
let maxPage = 0;
const pageSize = 40;

searchForm.addEventListener('submit', handleSearch);

async function handleSearch(event) {
  event.preventDefault();

  photoListEl.innerHTML = '';

  loader.classList.remove(hiddenClass);

  page = 1;

  const form = event.currentTarget;
  query = form.elements.query.value.trim();

  if (!query) {
    loader.classList.add(hiddenClass);
    loadMoreBtn.classList.add(hiddenClass);

    iziToast.show({
      message: 'Please enter your request',
      position: 'topRight',
      color: 'yellow',
    });
    return;
  }

  try {
    const { hits, totalHits } = await getPhotos(query);

    maxPage = Math.ceil(totalHits / pageSize);

    markupPhoto(hits, photoListEl);
    if (hits.length > 0 && hits.length !== totalHits) {
      loadMoreBtn.classList.remove(hiddenClass);
      loadMoreBtn.addEventListener('click', handleLoadMore);
    } else if (!hits.length) {
      loadMoreBtn.classList.add(hiddenClass);

      iziToast.show({
        message:
          'Sorry, there are no images matching your search query. Please try again!',
        position: 'center',
        color: 'red',
      });
    } else {
      loadMoreBtn.classList.add(hiddenClass);
    }
  } catch (error) {
    console.log(error);
  } finally {
    loader.classList.add(hiddenClass);

    form.reset();
  }
}

async function getPhotos(value, page = 1) {
  const BASE_URL = 'https://pixabay.com/api';
  const API_KEY = '41870399-9b44301246ceb98c07efd626a';
  
  try {
    const response = await axios.get(`${BASE_URL}/`, {
      params: {
        key: API_KEY,
        q: value,
        image_type: 'photo',
        orientation: 'horizontal',
        safesearch: 'true',
        per_page: 15,
        page,
      },
    });
    return response.data;
  } catch {
    iziToast.error({
      title: 'Error',
      position: 'center',
      color: 'red',
      message: 'Sorry! Try later! Server not working',
    });
    console.error(error.message);
  }
}

async function handleLoadMore() {
  page += 1;
  loaderLoadMore.classList.remove(hiddenClass);
  loadMoreBtn.classList.add(hiddenClass);

  const getHeightImgCard = document
    .querySelector('.gallery-item')
    .getBoundingClientRect();

  try {
    const { hits } = await getPhotos(query, page);
    markupPhoto(hits, photoListEl);
  } catch (error) {
    console.log(error);
  } finally {
    window.scrollBy({
      top: getHeightImgCard.height * 2,
      left: 0,
      behavior: 'smooth',
    });
    loaderLoadMore.classList.add(hiddenClass);
    loadMoreBtn.classList.remove(hiddenClass);
    if (page === maxPage) {
      loadMoreBtn.classList.add(hiddenClass);
      loadMoreBtn.removeEventListener('click', handleLoadMore);
      iziToast.show({
        color: 'blue',
        position: 'bottomCenter',
        message: "We're sorry, but you've reached the end of search results.",
      });
    }
  }
}

function markupPhoto(hits) {
  const markup = hits
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) =>
        `<li class="gallery-item">
  <a class="gallery-link" href="${largeImageURL}">
    <img
      class="gallery-image"
      src="${webformatURL}"
      alt="${tags}"
    />
  </a><div class="gallery-descr">
   <p>Likes: <br><span>${likes}</span></p>
   <p>Views: <br><span>${views}</span></p>
   <p>Comment: <br><span>${comments}</span></p>
   <p>Downloads: <br><span>${downloads}</span></p></div>
</li>`
    )
    .join('');
  photoListEl.insertAdjacentHTML('beforeend', markup);
  modalLightboxGallery.refresh();
}