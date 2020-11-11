const SEARCH_KEYWORD = 'travel';
const GENERAL_ERROR = 'Sorry, we could not fetch the data. Please check your internet connection and try again.';
const NO_RESULTS_MESSAGE = 'No results found.';

const pageInfo = {
	pageSize: 10,
	currentPage: undefined
}

const body = document.getElementsByTagName('body')[0];
const menuButton = document.getElementById('btn-menu');
const navMenu = document.getElementById('nav-menu');
const resultsGrid = document.getElementById('results-grid');
const pageSizeSelector = document.getElementById('page-size-selector');
const pageNav = document.getElementById('page-nav');
const modal = document.getElementById('result-modal');
const modalCloseButton = document.getElementById('btn-modal-close');

menuButton.addEventListener('click', toggleMenu);

// Toggles the header menu in mobile view
function toggleMenu(){
	navMenu.classList.toggle('open');
	this.classList.toggle('open');
}

// Search for images using Unsplash API, and then render the results grid
async function searchImages(searchTerm, pageSize = 10, currentPage = 1) {
	renderLoader();

	const searchURL = 
		`${BASE_URL}/search/photos?query=${searchTerm}
		&page=${currentPage}
		&per_page=${pageSize}
		&order_by=relevant`;

	// Get image results
	let response; 
	try {
		response = await fetch(searchURL,{
			method: 'GET',
			headers: {
				'Accept-Version': 'v1',
				'Authorization': `Client-ID ${UCK}`
			}
		});
	} catch(error) {
		showError(GENERAL_ERROR);
		return;
	}
	
	let data = await response.json();

	let { results, total_pages: totalPages } = data; 

	if (results.length > 0){
		pageInfo.currentPage = currentPage;

		generatePageNav(currentPage, totalPages );

		renderGrid(results);
	} else {
		showError(NO_RESULTS_MESSAGE);
	}
}

// Show loader till grid loads
function renderLoader() {
	resultsGrid.innerHTML = `
		<div class="loader"></div>
	`
	resultsGrid.classList.add('loading');
	resultsGrid.classList.remove('error');
}

// Convert image results from API to HTML and populate grid
function renderGrid(imageList) {
	const gridHTML = imageList.map(imageDetails => renderCard(imageDetails)).join('');

	resultsGrid.innerHTML = gridHTML;
	resultsGrid.classList.remove('loading');
	resultsGrid.classList.remove('error');

	const resultCards = resultsGrid.getElementsByClassName('result-card');

	for (let resultCard of resultCards) {
		resultCard.addEventListener('click', loadModal);
	}
}

// Generate HTML for a single card
function renderCard(imageDetails) {
	return (
		`
		<article class="result-card" data-modal-image="${imageDetails.urls.regular}" data-modal-text="${imageDetails["alt_description"]}">
			<img class="result-image" src="${imageDetails.urls.small}">
			<h2 class="result-title">${imageDetails["alt_description"]}</h2>
		</article>
		`
	);
}

searchImages(SEARCH_KEYWORD);

pageSizeSelector.addEventListener('change', reloadResults);

// Reloads results when page size changes
function reloadResults() {
	let pageSize = parseInt(this.value);
	searchImages(SEARCH_KEYWORD, pageSize);
	pageInfo.pageSize = pageSize;
	this.blur();
}

// Renders page nav based on currentPage and totalPages returned by API
function generatePageNav(currentPage, totalPages ) {
	let pageNavList = [];
	let visiblePageList = generateVisiblePageList(currentPage, totalPages);
	
	if (visiblePageList.length > 0) {
		// Add previous page button
		pageNavList.push(
			'<button id="btn-previous-page">← Previous</button>'
		);
		// iterate through visiblePageList and add individual page buttons
		visiblePageList.forEach((page) => {
			pageNavList.push( renderPagingButton(page, currentPage) );
		})
		// Add next page button
		pageNavList.push(
			'<button id="btn-next-page">Next →</button>'
		);

		// Render page nav HTML
		pageNav.innerHTML = pageNavList.join('');

		// Handle page nav state
		updatePageNavState(currentPage, totalPages);
	};
}

// Generates the array of upto 3 pages that are visible as paging nav buttons
function generateVisiblePageList(currentPage, totalPages){
	let visiblePageList = [];

	// Return empty array for the following error conditions: 
	// currentPage is 0 or invalid number, totalPages is 0 or invalid number, currentPage is greater than totalPages
	if ((typeof totalPages) !== 'number' || totalPages <= 0 || (typeof currentPage) !== 'number' || currentPage <= 0 || currentPage > totalPages){
		pageNav.classList.add('hidden');
		pageSizeSelector.classList.add('hidden');
		return [];
	} 

	pageNav.classList.remove('hidden');
	pageSizeSelector.classList.remove('hidden');
	// Add pages before and upto current page
	if (currentPage === 1){
		visiblePageList.push(currentPage);
	} else if (currentPage !== totalPages) {
		visiblePageList.push(currentPage - 1, currentPage);
	} else {
		// While on the last page, adds the current and previous 2 pages to the list, as long as they exist (are > 0);
		for(let i = currentPage; i > 0 && visiblePageList.length < 3; i--){
			visiblePageList.unshift(i);
		}
	}

	// Add pages after current page
	for (let i = currentPage+1; i <= totalPages && visiblePageList.length < 3; i++){
		visiblePageList.push(i);
	}

	return visiblePageList;
}

// Generates HTML for the individual paging buttons (besides the previous and next buttons)
function renderPagingButton(page, currentPage) {
	let classes = 'btn-paging';
	let isDisabled = false;
	if (page === currentPage) {
		classes += ' selected';
		isDisabled = true;
	}

	return (
		`
			<button class="${classes}" data-page="${page}" ${isDisabled ? "disabled" : ""}>${page}</button>
		`
	)
};

// Handles button states for paging buttons and adds event listeners
function updatePageNavState(currentPage, totalPages) {
	const previousPageButton = document.getElementById('btn-previous-page');
	const nextPageButton = document.getElementById('btn-next-page');
	const pageButtons = document.getElementsByClassName('btn-paging');
	
	// Disable previous page button if currentPage = 1
	if (currentPage === 1) {
		previousPageButton.disabled = true;
	} else {
		previousPageButton.addEventListener('click', loadPreviousPage);
	}

	// Disable next page button if we are on the last page
	if (currentPage === totalPages) {
		nextPageButton.disabled = true;
	} else {
		nextPageButton.addEventListener('click', loadNextPage);
	}

	for (let pageButton of pageButtons) {
		pageButton.addEventListener('click', loadPage);
	}
}

// Loads the previous page
function loadPreviousPage() {
	searchImages(SEARCH_KEYWORD, pageInfo.pageSize, pageInfo.currentPage - 1);
}

// Loads the next page
function loadNextPage() {
	searchImages(SEARCH_KEYWORD, pageInfo.pageSize, pageInfo.currentPage + 1);
}

// Loads new page, based on page indicated on button
function loadPage() {
	let newPage = parseInt(this.dataset.page);
	searchImages(SEARCH_KEYWORD, pageInfo.pageSize, newPage);
}

// Load the modal
function loadModal() {
	const modalFullImage = modal.getElementsByClassName("full-image")[0];
	modalFullImage.src = this.dataset.modalImage;
	const modalText = modal.getElementsByClassName("image-caption")[0];
	modalText.innerText = this.dataset.modalText;
	modal.classList.toggle('hidden');
	body.classList.toggle('modal-open');
}

modalCloseButton.addEventListener('click', hideModal);

function hideModal() {
	modal.classList.toggle('hidden');
	body.classList.toggle('modal-open');
}

// Function to show general error while loading the results grid
function showError(message) {
	resultsGrid.innerHTML = `
		<div class="error-message">${message}</div>
	`
	resultsGrid.classList.add('error');
	resultsGrid.classList.remove('loading');
	pageSizeSelector.classList.add('hidden');
}