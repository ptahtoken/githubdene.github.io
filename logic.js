var searchResultFormat = '<tr><td><a href="$link"';
var totalLimit = 750;

var controls = {
    oldColor: '',
    displayResults: function() {
        if (results.style) {
            results.style.display = '';
        }
        resultsTableHideable.classList.remove('hide');
    },
    hideResults: function() {
        if (results.style) {
            results.style.display = 'none';
        }
        resultsTableHideable.classList.add('hide');
    },
    doSearch: function(match, dataset) {
        results = [];

        words = match.toLowerCase();
        words = words.split(' ');
        regex = '';
        posmatch = [];
        negmatch= [];
        // Lazy way to create regex (?=.*word1)(?=.*word2) this matches all words.
        for (i = 0; i < words.length; i++) {
            if (words[i][0] != '-') {
                posmatch.push(words[i]);
                regex += '(?=.*' + words[i] + ')';
            } else {
                negmatch.push(words[i].substring(1));
                //regex += '(^((?!' + words[i].substring(1) + ').)*$)';
            }
        }
        if (negmatch.length > 0 ) {
          regex += '(^((?!('; // + words[i].substring(1) + ').)*$)';
          for (i= 0; i < negmatch.length; i++) {
            regex += negmatch[i];
            if (i != negmatch.length -1) {
              regex += '|';
            }
          }
        regex += ')).)*$)';
        }

        dataset.forEach(e => {
            // this goes the same, just as for dataset title and target this basically checks the regex against the fields from the dataset entries
            // concatenate e.labels
            var labels = '';
            e.labels.forEach(t => {
                labels += t + ' ';
            });
                
            if ((e.title + e.target + labels).toLowerCase().match(regex)) results.push(e);
        });
        return results;
    },
    updateResults: function(loc, results) {
        if (results.length == 0) {
            noResults.style.display = '';
            noResults.textContent = 'No Results Found';

            resultsTableHideable.classList.add('hide');
        } else if (results.length > totalLimit) {
            noResults.style.display = '';
            resultsTableHideable.classList.add('hide');
            noResults.textContent = 'Error: ' + results.length + ' results were found, try being more specific';
            this.setColor(colorUpdate, 'too-many-results');
        } else {
            var tableRows = loc.getElementsByTagName('tr');
            for (var x = tableRows.length - 1; x >= 0; x--) {
                loc.removeChild(tableRows[x]);
            }

            noResults.style.display = 'none';
            resultsTableHideable.classList.remove('hide');

            results.forEach(r => {

                let labels = r.labels;
                
                // concatenate all labels into a single string
                let labelString = '';
                for (let i = 0; i < labels.length; i++) {
                    labelString += labels[i];
                    if (i != labels.length - 1) {
                        labelString += ', ';
                    }
                }

                el = searchResultFormat
                    .replace('$target', r.target) // if r.target is not available, use r.title
                    .replace('$title', r.title)
                    .replace('$link', r.html_url)
                    .replace('$tag2', r.title)
                    .replace('$tag', r.title);

                // TODO: highlight the APPROVED issues' labels

                var wrapper = document.createElement('table');
                wrapper.innerHTML = el;
                var div = wrapper.querySelector('tr');

                loc.appendChild(div);
            });
        }
    },
    setColor: function(loc, indicator) {
        if (this.oldColor == indicator) return;
        var colorTestRegex = /^color-/i;

        loc.classList.forEach(cls => {
            //we cant use class so we use cls instead :>
            if (cls.match(colorTestRegex)) loc.classList.remove(cls);
        });
        loc.classList.add('color-' + indicator);
        this.oldColor = indicator;
    }
};
window.controls = controls;

document.addEventListener('DOMContentLoaded', function() {
    results = document.querySelector('div.results');
    searchValue = document.querySelector('input.search');
    form = document.querySelector('form.searchForm');
    resultsTableHideable = document.getElementsByClassName('results-table').item(0);
    resultsTable = document.querySelector('tbody.results');
    resultsTable = document.querySelector('tbody.results');
    noResults = document.querySelector('div.noResults');
    colorUpdate = document.body;

    // Preventing initial fade
    document.body.classList.add('fade');

    var currentSet = [];
    var oldSearchValue = '';

    function doSearch(event) {
        var val = searchValue.value;

        if (val != '') {
            controls.displayResults();
            currentSet = window.dataset;
            oldSearchValue = val;

            currentSet = window.controls.doSearch(val, currentSet);
            if (currentSet.length < totalLimit) window.controls.setColor(colorUpdate, currentSet.length == 0 ? 'no-results' : 'results-found');

            window.controls.updateResults(resultsTable, currentSet);
        } else {
            controls.hideResults();
            window.controls.setColor(colorUpdate, 'no-search');
            noResults.style.display = 'none';
            currentSet = window.dataset;
        }

        if (event.type == 'submit') event.preventDefault();
    }

    fetch('./all_findings_issues.json')
        .then(res => res.json())
        .then(data => {
            window.dataset = data;
            currentSet = window.dataset;
            window.controls.updateResults(resultsTable, window.dataset);
            doSearch({ type: 'none' });
        });

    form.submit(doSearch);

    searchValue.addEventListener('input', doSearch);
});
