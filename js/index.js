/** @type {HTMLElement} */
let inProgressList;
/** @type {HTMLElement} */
let doneList;
/** @type {HTMLElement} */
let addBtn;
/** @type {HTMLElement} */
let inProgressPB;
/** @type {HTMLElement} */
let donePB;

let list = new Map();

const saveList = function () {
    // Convert Map to array
    let json = JSON.stringify([...list.values()]);
    console.log([...list.values()]);
    if (json) {
        window.localStorage.setItem('list', json);
    }
}

const setFocus = function (field) {
    field.classList.add('editing');
    field.readOnly = false;
    field.focus();
}
const removeFocus = function (field) {
    field.classList.remove('editing');
    field.readOnly = true;
    field.blur();
}

// Updates the progress bars
const updatePBs = function () {
    let counter = 0;
    list.forEach(item => {
        counter += Number(item.isDone);
    });
    let width = 100 * (counter / list.size);
    inProgressPB.lastElementChild.style.width   = `${width}%`;
    donePB.lastElementChild.style.width         = `${width}%`;
}

const updateItemTimestamp = function (item) {
    let newTimestamp = String(Date.now());
    let oldTimestamp = item.getAttribute('timestamp');
    item.setAttribute('timestamp', newTimestamp);
    let itemData = list.get(oldTimestamp);
    itemData.timestamp = newTimestamp;
    list.delete(oldTimestamp);
    list.set(newTimestamp, itemData);
}

// Returns HTMLElement instance of list item and adds itemData to the Map
const createItem = function (itemData=null) {
    let item = document.createElement('li');
    item.classList.add('list-item');
    // Constructing checkbox
    let checkbox = document.createElement('input');
    checkbox.classList.add('checkbox');
    checkbox.type = 'checkbox';
    checkbox.addEventListener('click', (event) => {
        item.classList.toggle('done');
        list.get(item.getAttribute('timestamp')).isDone = checkbox.checked;
        // Moving list item to the corresponding list
        item.remove();
        if (checkbox.checked) {
            item = doneList.appendChild(item);
        } else {
            item = inProgressList.appendChild(item);
        }
        // Updating date of the last move
        updateItemTimestamp(item);
    });
    // Constructing input field which is contains list item's value 
    let inputVal = document.createElement('input');
    inputVal.classList.add('item-value');
    inputVal.type = 'text';
    inputVal.readOnly = true;

    // Handler that called whenever input field lost focus or value were changed.
    let submitHandler = (event) => {
        if (inputVal.value == '') {
            deleteItem(item);
        } else {
            list.get(item.getAttribute('timestamp')).value = inputVal.value;
        }
        removeFocus(inputVal);
    };

    inputVal.addEventListener('change', submitHandler);
    inputVal.addEventListener('focusout', submitHandler);
    inputVal.addEventListener('dblclick', (event) => {
        setFocus(inputVal);
    });
    // Preventing selection of input field by clicking once
    inputVal.addEventListener('click', (event) => {
        if (!inputVal.classList.contains('editing')) {
            inputVal.blur();
        }
    });
    // Constructing x-button element
    let deleteBtn = document.createElement('a');
    deleteBtn.classList.add('delete');
    deleteBtn.innerText = 'x';
    deleteBtn.href = '#';
    deleteBtn.addEventListener('click', (event) => deleteItem(item));
    
    // Putting all together
    item.appendChild(checkbox);
    item.appendChild(inputVal);
    item.appendChild(deleteBtn);
    
    // Configuring initial values based on itemData
    if (itemData) {
        item.setAttribute('timestamp', itemData.timestamp);
        inputVal.value = itemData.value;
        checkbox.checked = itemData.isDone;
        if (itemData.isDone) {
            item.classList.add('done');
        }
        // Adding itemData to the Map
        list.set(itemData.timestamp, itemData);
    } else {
        // Default initial values
        let timestamp = String(Date.now());
        item.setAttribute('timestamp', timestamp);
        inputVal.value = '';
        // Adding newly created item data to the Map
        list.set(timestamp, {value: '', isDone: false, timestamp: timestamp});
    }

    return item;
}

const deleteItem = function (item) {
    list.delete(item.getAttribute('timestamp'));
    item.remove();
    updatePBs();
} 

const loadList = function () {
    let loadedList = JSON.parse(window.localStorage.getItem('list'));
    loadedList.forEach(item => {
        if (!item.isDone) {
            inProgressList.appendChild(createItem(item));
        } else {
            doneList.appendChild(createItem(item));
        }
    });
}

window.onload = function () {
    addBtn = document.querySelector('.add-item');
    inProgressList = document.querySelector('#in-progress.list-container>ul');
    doneList = document.querySelector('#done.list-container>ul');
    inProgressPB = document.querySelector('#in-progress.progress-bar');
    donePB = document.querySelector('#done.progress-bar');

    let clearBtn = document.querySelector(".clear");
    clearBtn.addEventListener('click', (event) => {
        list.clear();
        document.location.reload();
    });

    // Loads list from localStorage is there is one
    if (window.localStorage.length > 0) {
        loadList();
    }
    
    addBtn.addEventListener('mousedown', (event) => {
        let newItem = createItem();
        // Delay needed to be sure that new item exists (it's just works)
        new Promise((resolve) => {
            inProgressList.appendChild(newItem);
            this.setTimeout(() => {
                resolve('bruh');
            }, 0);
        }).then(()=> {
            setFocus(newItem.querySelector('.item-value'));
        })
    });

    // Updating progress bars at page load
    updatePBs();
}

// Updating progress bars when page content changes
window.onchange = updatePBs;
// Saving list to the local storage when page unloads
window.onunload = saveList;