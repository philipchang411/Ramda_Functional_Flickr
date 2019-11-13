const R = require('ramda');

/* ********************************************************************************************** */
/* ****************************          Predicate  Methods           *************************** */
/* ********************************************************************************************** */
// Check if value of x is 0. Return true if x is 0, false otherwise.
const isZero = x => x === 0;

// Check if value of the input is Alphanumeric. Return true if it is, false otherwise.
const isAlphaNumeric = R.compose(isZero, R.length(), R.match(/[^a-zA-Z0-9]/g));

// Compare to string (Commonly used for sorting strings). Return true string a is less than string
// b, false otherwise.
const compareStrings = R.comparator((a, b) => a < b);

// Takes a property (prop) of an object and converts it to a JS date object. Useful for the
// 'date_taken' property of Flickr data. Use: lensPropToJSDate('date_taken') => Date Object. Returns
// Date object
const lensPropToJSDate = prop => R.over(R.lensProp(prop))(item => new Date(item));

/* ********************************************************************************************** */
/* ****************************            Helper Methods             *************************** */
/* ********************************************************************************************** */
// Takes input of 1 or more string object separated by spaces (like the tags of the flickr data) in
// arrays, and turns them into an array of single word string objects.
const combineStringArray = R.compose(
  R.split(' '),
  R.join(' '),
);

/* ********************************************************************************************** */
/* **************************** Filtering Properties From Flickr JSON *************************** */
/* ********************************************************************************************** */
// Returns the array of objects in the item property
const flickrImageData = R.compose(
  R.prop('items'),
);

// Returns an array of combined tags of all images in the items property
const flickrTags = R.compose(
  combineStringArray,
  R.map(R.prop('tags')),
  flickrImageData,
);

// Returns an array titles for the images in the items property
const flickrTitles = R.compose(
  R.map(R.prop('title')),
  flickrImageData,
);

/* ********************************************************************************************** */
/* ****************************         OTHER Helper Methods          *************************** */
/* ********************************************************************************************** */

const filterAlphaNumeric = R.compose(
  R.filter(item => isAlphaNumeric(item)),
  combineStringArray,
);

const filterNotAlphaNumeric = R.compose(
  R.filter(item => !isAlphaNumeric(item)),
  combineStringArray,
);

const lowerCaseUniq = R.compose(
  R.uniq(), //Returns a new list containing only one copy of each element
  R.map(item => R.toLower(item)),
);

/* ******************************************** */
/* ************FUNCTIONS I MADE**************** */
/* ******************************************** */

//Used to find unique alphanumeric tags
const uniqAlphatags = R.compose(
  lowerCaseUniq,
  filterAlphaNumeric,
  flickrTags,
);

//Used to find tags that are not alphanumeric
const nonalphaTags = R.compose(
  filterNotAlphaNumeric,
  flickrTags,
)

//Used to have a list of the title lengths 
const titleLength = R.compose(
  R.map(item => R.length(item)),
  flickrTitles
)

//Returns the date of all the images
const flickrDate = R.compose(
  R.map(R.prop('date_taken')),
  flickrImageData,
)

//Creates a "list" of titles and dates of the images
const titleAndDates = x => R.zipObj(flickrTitles(x), flickrDate(x));

//Sorts the list in ascending order
const sortAscending = x => R.sortWith([R.ascend(R.prop(x))]);

const sortDescending = x => R.sortWith([R.descend(R.prop(x))]);

//creates pairs
const makePair = (x,y) => R.compose(
  R.map(R.zipObj([x, y])), 
  R.toPairs,
  )

//counts the lower cases
const lowerCount = R.countBy(R.toLower);

/* ********************************************************************************************** */
/* ****************************   Functions Required For Assignment   *************************** */
/* ********************************************************************************************** */

const imageCount = R.compose(R.length, flickrTitles); //Pure
//const imageCount = (x) => flickrTitles(x).length    //Inpure

const alphaNumericTagsUniq = (x) => R.sort(compareStrings, uniqAlphatags(x))

const nonAlphaNumericTags = R.compose(nonalphaTags)

const avgTitleLength = R.pipe(
  titleLength,
  R.mean()
)

const commonTagByRank = (x) => R.pipe(
  flickrTags,
  lowerCount,
  makePair('word', 'count'),
  sortDescending('count'),
  R.nth(x),
  R.prop('word'),
)

const oldestPhotoTitle = R.pipe(
  titleAndDates,
  makePair('title', 'date'),
  sortAscending('date'),
  R.nth(0),
  R.prop('title')
)

/* ********************************************************************************************** */
/* ********************************************************************************************** */
/* ****************************          All JSON Test Code           *************************** */
/* ****************************             DO NOT ALTER              *************************** */
/* ********************************************************************************************** */
/* ********************************************************************************************** */
const fs = require('fs');
const {
  makePromiseTest, runAllPromiseTest, alphaNumericTagsUniqTest1, alphaNumericTagsUniqTest2,
} = require('./testsetup');

const flickrDataDog = JSON.parse(fs.readFileSync('dogs.json', 'utf8'));
const flickrDataLandscapes = JSON.parse(fs.readFileSync('landscapes.json', 'utf8'));

runAllPromiseTest([
  makePromiseTest('Is flickrDataDog an object?', typeof flickrDataDog, 'object'),
  makePromiseTest('Images count should be 20', imageCount(flickrDataDog), 20),
  makePromiseTest(
    'Should get an array of all the unique alphanumeric tags after transforming to lower case, '
    + 'sorted lexicographically',
    alphaNumericTagsUniq(flickrDataDog), R.sort(compareStrings)(alphaNumericTagsUniqTest1),
  ),
  makePromiseTest(
    'Should Only Be 1 non alphanumeric tag as "świnoujście"',
    R.compose(R.head, nonAlphaNumericTags)(flickrDataDog), 'świnoujście',
  ),
  makePromiseTest(
    'Average Title Length Should be 26 (Rounded)',
    R.compose(Math.round, avgTitleLength)(flickrDataDog), 26,
  ),
  makePromiseTest(
    'Third most common tag should be "puppy" (0 index, where 0 is most common)',
    commonTagByRank(2)(flickrDataDog), 'puppy',
  ),
  makePromiseTest(
    'Oldest Photo Taken Title Should Be "20160626_P1060675"',
    oldestPhotoTitle(flickrDataDog), '20160626_P1060675',
  ),
]);

runAllPromiseTest([
  makePromiseTest('Is flickrDataLandscapes an object?', typeof flickrDataLandscapes, 'object'),
  makePromiseTest('Images count should be 20', imageCount(flickrDataLandscapes), 20),
  makePromiseTest(
    'Should get an array of all the unique alphanumeric tags after transforming to lower case, '
    + 'sorted lexicographically',
    alphaNumericTagsUniq(flickrDataLandscapes), R.sort(compareStrings)(alphaNumericTagsUniqTest2),
  ),
  makePromiseTest(
    'Should not be any non-alphanumeric tags (resulting in an [])',
    R.compose(nonAlphaNumericTags)(flickrDataLandscapes), [],
  ),
  makePromiseTest(
    'Average Title Length Should be 16 (Rounded)',
    R.compose(Math.round, avgTitleLength)(flickrDataLandscapes), 16,
  ),
  makePromiseTest(
    'Third most common tag should be "landscaping" (0 index, where 0 is most common)',
    commonTagByRank(2)(flickrDataLandscapes), 'landscaping',
  ),
  makePromiseTest(
    'Oldest Photo Taken Title Should Be "Boats of Golyazi"',
    oldestPhotoTitle(flickrDataLandscapes), 'Boats of Golyazi',
  ),
]);
 