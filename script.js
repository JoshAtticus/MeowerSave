let jsonData;
        let currentPage = 1;
        const postsPerPage = 25;

        document.getElementById('submit-button').addEventListener('click', function () {
            const username = document.getElementById('username-input').value;
            this.disabled = true;
            this.textContent = "Loading...";
            fetchUserData(username);
        });

        function fetchUserData(username) {
            fetch(`https://meowerdata.joshatticus.online/user/${username}`)
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        document.getElementById('error-message').textContent = data.reason;
                    } else {
                        jsonData = data;
                        displayUserInfo();
                        displayPosts();
                        displayPagination();
                        document.getElementById('error-message').textContent = '';
                    }
                })
                .catch(error => {
                    document.getElementById('error-message').textContent = "An error occurred while fetching data.";
                })
                .finally(() => {
                    document.getElementById('submit-button').textContent = "Submit";
                    document.getElementById('submit-button').disabled = false;
                });
        }

        function displayUserInfo() {
            const userInfo = jsonData.user_info;
            const pfpData = userInfo.pfp_data - 1;
            const crawlTimestamp = userInfo.crawl_timestamp;
        
            const pfpElement = document.getElementById('pfp');
            pfpElement.style.backgroundColor = '#ffffff';
            pfpElement.style.borderRadius = '1.25em';
            pfpElement.style.width = '75px'; // reduced size
            pfpElement.style.height = '75px'; // reduced size
            pfpElement.style.overflow = 'hidden';
        
            const cardTitleElement = document.querySelector('.card-title');
            cardTitleElement.style.display = 'flex';
            cardTitleElement.style.alignItems = 'center';
            cardTitleElement.style.gap = '10px';
        
            if (userInfo.avatar) {
                fetch(`https://meowerdata.joshatticus.online/user/avatar/${userInfo._id}`)
                    .then(response => response.blob())
                    .then(image => {
                        let url = URL.createObjectURL(image);
                        pfpElement.innerHTML = `<img src="${url}" style="width: 100%; height: 100%; object-fit: cover;">`;
                    });
            } else {
                pfpElement.innerHTML = `<img src="https://raw.githubusercontent.com/meower-media-co/Meower-Svelte/develop/src/assets/avatars/icon_${pfpData}.svg" style="width: 100%; height: 100%; object-fit: cover;">`;
            }
        
            document.getElementById('username').textContent = userInfo._id;
            document.getElementById('quote').innerHTML = `<em>${userInfo.quote ? userInfo.quote : 'No Quote Set'} | Data last updated ${getTimeSince(crawlTimestamp)} ago | ${userInfo.banned ? 'Banned' : 'Not Banned'}</em>`;
        
            document.getElementById('user-info').style.display = 'block';
        }

        function displayPosts() {
            const postsContainer = document.getElementById('posts');
            postsContainer.innerHTML = '';

            const posts = jsonData.posts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

            if (posts.length === 0) {
                postsContainer.innerHTML = '<p>No posts found.</p>';
            } else {
                posts.forEach(post => {
                    const postId = post.post_id;
                    const timestamp = post.timestamp;
                    const date = new Date(timestamp * 1000);
                    const formattedDate = date.toLocaleString();

                    const postElement = document.createElement('div');
                    postElement.innerHTML = `<p>${parsePostContent(post.content)}</p><p><small>Created on ${formattedDate}</small></p>`;
                    postElement.innerHTML += '<hr>';
                    postsContainer.appendChild(postElement);
                    document.getElementById('search-box').style.display = 'block';
                });
            }

            document.getElementById('posts-container').style.display = 'block';
        }

        function parsePostContent(content) {
            const regex = /\[([^\]]+)\]\s*:\s*([^[\]]+)/g;
            return content.replace(regex, '<img alt="$1" src="$2">');
        }

        function displayPagination() {
            const totalPages = Math.ceil(jsonData.posts.length / postsPerPage);
            const prevButton = document.getElementById('prev-button');
            const nextButton = document.getElementById('next-button');
            const currentPageElement = document.getElementById('current-page');

            if (currentPage === 1) {
                prevButton.classList.add('disabled');
            } else {
                prevButton.classList.remove('disabled');
            }

            if (currentPage === totalPages) {
                nextButton.classList.add('disabled');
            } else {
                nextButton.classList.remove('disabled');
            }

            currentPageElement.textContent = `Page ${currentPage} of ${totalPages}`;

            prevButton.addEventListener('click', function () {
                if (currentPage > 1) {
                    currentPage--;
                    displayPosts();
                    displayPagination();
                }
            });

            nextButton.addEventListener('click', function () {
                if (currentPage < totalPages) {
                    currentPage++;
                    displayPosts();
                    displayPagination();
                }
            });

            document.getElementById('pagination-container').style.display = 'block';

            currentPageElement.addEventListener('click', function () {
                const totalPages = Math.ceil(jsonData.posts.length / postsPerPage);
                let enteredPage = prompt('Enter a page number to go to:', currentPage);
                enteredPage = parseInt(enteredPage);
                if (isNaN(enteredPage) || enteredPage <= 0 || enteredPage > totalPages) {
                    alert(`Invalid page number. Please enter a number between 1 and ${totalPages}.`);
                } else {
                    goToPage(enteredPage);
                }
            });
        }

        function getTimeSince(timestamp) {
            const seconds = Math.floor((new Date() - timestamp * 1000) / 1000);
            const intervals = {
                year: 31536000,
                month: 2592000,
                week: 604800,
                day: 86400,
                hour: 3600,
                minute: 60,
                second: 1
            };

            let counter;
            for (const interval in intervals) {
                counter = Math.floor(seconds / intervals[interval]);
                if (counter > 0) {
                    return counter === 1 ? counter + ' ' + interval : counter + ' ' + interval + 's';
                }
            }
        }

        function convertTimestampToDate(timestamp) {
            const date = new Date(timestamp * 1000);
            return date.toLocaleString();
        }

        document.getElementById('search-button').addEventListener('click', function () {
            const searchButton = document.getElementById('search-button');
            if (searchButton.textContent === 'Search') {
                const searchQuery = document.getElementById('search-input').value.toLowerCase();
                const posts = jsonData.posts;
                const filteredPosts = posts.filter(post => post.content.split(' ').includes(searchQuery));

                document.getElementById('search-results').textContent = `${filteredPosts.length} results found`;
                if (filteredPosts.length === 0) {
                    document.getElementById('posts').innerHTML = '<p>No posts found.</p>';
                } else {
                    displayFilteredPosts(filteredPosts);
                }

                searchButton.textContent = 'Clear';
            } else {
                displayPosts();
                document.getElementById('search-results').textContent = '';
                searchButton.textContent = 'Search';
            }
        });

        document.getElementById('search-input').addEventListener('input', function () {
            document.getElementById('search-button').textContent = 'Search';
        });

        function displayFilteredPosts(posts) {
            const postsContainer = document.getElementById('posts');
            postsContainer.innerHTML = '';

            posts.forEach(post => {
                const postId = post.post_id;
                const timestamp = post.timestamp;
                const date = new Date(timestamp * 1000);
                const formattedDate = date.toLocaleString();
                const originalIndex = jsonData.posts.findIndex(originalPost => originalPost.post_id === postId);
                const pageNumber = Math.floor(originalIndex / postsPerPage) + 1;
                const postElement = document.createElement('div');
                postElement.innerHTML = `<p>${parsePostContent(post.content)}</p><p><small>Created on ${formattedDate} | <a href="#" onclick="goToPage(${pageNumber});return false;">Post on page ${pageNumber}</a></small></p>`;
                postElement.innerHTML += '<hr>';
                postsContainer.appendChild(postElement);
            });
        }

        function goToPage(pageNumber) {
            currentPage = pageNumber;
            clearSearch();
            displayPosts();
            displayPagination();
            window.scrollTo(0, 0);
        }


        prevButton.addEventListener('click', function () {
            if (currentPage > 1) {
                currentPage--;
                clearSearch();
                displayPosts();
                displayPagination();
            }
        });

        nextButton.addEventListener('click', function () {
            if (currentPage < totalPages) {
                currentPage++;
                clearSearch();
                displayPosts();
                displayPagination();
            }
        });

        function clearSearch() {
            document.getElementById('search-input').value = '';
            document.getElementById('search-results').textContent = '';
            document.getElementById('search-button').textContent = 'Search';
        }
