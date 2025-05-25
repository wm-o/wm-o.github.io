// assets/js/search-in-place.js

document.addEventListener('DOMContentLoaded', function() {
    var footerSearchForm = document.getElementById('footer-search-form');
    var footerSearchBox = document.getElementById('footer-search-box');
    var searchResultsArea = document.getElementById('footer-search-results-area');
    var searchResultsList = document.getElementById('footer-search-results');
    var clearSearchButton = document.getElementById('clear-footer-search');
    var originalContent = document.querySelector('main > *:not(#footer-search-results-area)'); // 검색 결과 영역을 제외한 원래 콘텐츠

    var idx; // Lunr 인덱스
    var posts = []; // 원본 게시물 데이터 (search.json에서 로드)

    // Lunr 인덱스 초기화 및 검색 데이터 로드
    function initLunr() {
        fetch('/search.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                posts = data; // 원본 데이터 저장
                idx = lunr(function () {
                    this.ref('url'); // 고유 식별자
                    this.field('title', { boost: 10 }); // 제목 필드 (가중치 높음)
                    this.field('content'); // 본문 필드
                    this.field('date'); // 날짜 필드 (검색 가능하도록)

                    data.forEach(function (doc) {
                        this.add(doc);
                    }, this);
                });
                console.log('Lunr index loaded successfully.');
            })
            .catch(error => {
                console.error('Error loading search index:', error);
                searchResultsList.innerHTML = '<li style="color: red;">검색 인덱스를 불러오는 데 실패했습니다.</li>';
                searchResultsArea.style.display = 'block';
            });
    }

    // 검색 실행 함수
    function performSearch(query) {
        if (!idx) {
            searchResultsList.innerHTML = '<li>검색 엔진 로드 중입니다. 잠시 후 다시 시도해 주세요.</li>';
            searchResultsArea.style.display = 'block';
            return;
        }

        searchResultsList.innerHTML = ''; // 기존 결과 초기화
        searchResultsArea.style.display = 'block'; // 검색 결과 영역 보이게
        originalContent.style.display = 'none'; // 원래 콘텐츠 숨기기
        clearSearchButton.style.display = 'block'; // 지우기 버튼 보이게

        if (!query.trim()) {
            searchResultsList.innerHTML = '<li>검색어를 입력해 주세요.</li>';
            return;
        }

        var searchResults = idx.search(query); // Lunr 검색 실행

        if (searchResults.length === 0) {
            searchResultsList.innerHTML = `<li>"${query}"에 대한 검색 결과가 없습니다.</li>`;
            return;
        }

        // 결과를 HTML에 표시
        searchResults.forEach(function(result) {
            var post = posts.find(p => p.url === result.ref); // 원본 데이터에서 게시물 찾기
            if (post) {
                var li = document.createElement('li');
                li.className = 'post-item';

                var titleLink = document.createElement('a');
                titleLink.href = post.url;
                titleLink.textContent = post.title;

                var mainLineDiv = document.createElement('div');
                mainLineDiv.className = 'post-main-line';
                mainLineDiv.appendChild(titleLink);

                var dateDiv = document.createElement('div');
                dateDiv.className = 'post-date';
                dateDiv.textContent = post.date;

                li.appendChild(mainLineDiv);
                li.appendChild(dateDiv);
                searchResultsList.appendChild(li);
            }
        });
    }

    // 검색 결과 지우기 함수
    function clearSearchResults() {
        searchResultsArea.style.display = 'none'; // 검색 결과 영역 숨기기
        searchResultsList.innerHTML = ''; // 결과 목록 초기화
        clearSearchButton.style.display = 'none'; // 지우기 버튼 숨기기
        originalContent.style.display = ''; // 원래 콘텐츠 다시 보이게 (기본 display 값으로)
        footerSearchBox.value = ''; // 검색 입력창 초기화
    }

    // 이벤트 리스너 등록
    footerSearchForm.addEventListener('submit', function(event) {
        event.preventDefault(); // 폼 기본 제출 동작 방지
        performSearch(footerSearchBox.value.trim());
    });

    clearSearchButton.addEventListener('click', clearSearchResults);

    // 페이지 로드 시 Lunr 인덱스 초기화
    initLunr();
});
