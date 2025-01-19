"use strict";
const N = 20;
function toggleModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        if (modal.classList.toggle('hidden')) {
            const content = modal.querySelector('.content');
            content.innerHTML = '';
            const approveBtn = modal.querySelector('#approve');
            approveBtn.remove();
        }
    }
}
async function query(url, method, body, query) {
    const request = await fetch(url + (query ? `?${new URLSearchParams(query).toString()}` : ''), {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    if (!request.ok) {
        throw new Error(await request.text());
    }
    return request;
}
function validateString(str) {
    return str && str.length > 0;
}
function addRow(element, options) {
    element.classList.add(options.className);
    let p = element.appendChild(document.createElement('p'));
    p.innerText = options.name;
    p.classList.add('title');
    p = element.appendChild(document.createElement('p'));
    p.innerText = options.value;
    return p;
}
function addInput(element, options) {
    const container = document.createElement('div');
    container.classList.add(...options.classes);
    const label = document.createElement('label');
    label.htmlFor = options.label + options.uuid;
    label.innerText = options.labelName;
    const input = document.createElement('input');
    input.type = options.type;
    input.id = options.label + options.uuid;
    container.appendChild(label);
    container.appendChild(input);
    element.appendChild(container);
    return input;
}
function addSelect(element, options) {
    const container = document.createElement('div');
    container.classList.add(...options.classes);
    const label = document.createElement('label');
    label.htmlFor = options.label + options.uuid;
    label.innerText = options.labelName;
    const select = document.createElement('select');
    select.id = options.label + options.uuid;
    const mainOption = document.createElement('option');
    mainOption.innerText = options.mainOption;
    mainOption.disabled = true;
    select.appendChild(mainOption);
    container.appendChild(label);
    container.appendChild(select);
    element.appendChild(container);
    return select;
}
async function addSelectSql(element, options) {
    const select = addSelect(element, options);
    const result = await query(options.query.url, options.query.method, options.query.body, options.query.query);
    const rows = await result.json();
    for (const row of rows) {
        const option = document.createElement('option');
        option.innerText = row.value;
        option.value = row.id;
        select.appendChild(option);
        if (row.value === options.value) {
            select.value = row.id;
        }
    }
    return select;
}
async function addItems(li, listCont, applicationsIds) {
    if (applicationsIds && applicationsIds.length > 0) {
        let result;
        let row;
        for (const applicationId of applicationsIds) {
            result = await query('application', 'GET', undefined, { id: applicationId });
            row = await result.json();
            addItem(li, listCont, row[0]);
        }
    }
}
function validateCount(li, applicationSize) {
    return +li.getAttribute('applications-last-count') + applicationSize >= 0;
}
function getComplexity(value) {
    switch (value) {
        case 'Низкая':
            return 2;
        case 'Средняя':
            return 4;
        case 'Высокая':
            return 8;
        case '2':
            return 'Низкая';
        case '4':
            return 'Средняя';
        case '8':
            return 'Высокая';
        default:
            return 0;
    }
}
function addItem(li, listCont, options) {
    const listItem = document.createElement('div');
    listItem.classList.add('list-item');
    listItem.setAttribute('edited', 'false');
    if (!options) {
        listItem.classList.add('editable');
    }
    else {
        listItem.id = options.id;
    }
    const id = options ? options.id : crypto.randomUUID();
    const itemId = listItem.appendChild(document.createElement('div'));
    itemId.classList.add('item-id');
    itemId.innerHTML = `<p class="title">ID: ${id}</p>`;
    const itemAddress = listItem.appendChild(document.createElement('div'));
    itemAddress.classList.add('item-address');
    itemAddress.innerHTML = '<p class="title">Адресс:</p>';
    const itemAddressInput = addInput(itemAddress, {
        uuid: id,
        classes: ['inp'],
        label: 'address',
        labelName: '',
        type: 'text'
    });
    itemAddressInput.addEventListener('change', () => {
        listItem.setAttribute('edited', 'true');
    });
    const itemAddressP = itemAddress.appendChild(document.createElement('p'));
    if (options && options.address) {
        itemAddressP.innerText = options.address;
        itemAddressInput.value = options.address;
    }
    itemAddressP.setAttribute('value', itemAddressInput.value);
    const itemComplexity = listItem.appendChild(document.createElement('div'));
    itemComplexity.classList.add('item-complexity');
    itemComplexity.innerHTML = '<p class="title">Сложность:</p>';
    const itemComplexitySelect = addSelect(itemComplexity, {
        uuid: id,
        classes: ['inp'],
        label: 'complexity',
        labelName: '',
        mainOption: 'Выберите сложность',
    });
    let option = itemComplexitySelect.appendChild(document.createElement('option'));
    option.value = 'Низкая';
    option.innerText = 'Низкая';
    option = itemComplexitySelect.appendChild(document.createElement('option'));
    option.value = 'Средняя';
    option.innerText = 'Средняя';
    option = itemComplexitySelect.appendChild(document.createElement('option'));
    option.value = 'Высокая';
    option.innerText = 'Высокая';
    itemComplexitySelect.addEventListener('change', () => {
        listItem.setAttribute('edited', 'true');
    });
    const itemComplexityP = itemComplexity.appendChild(document.createElement('p'));
    if (options && options.complexity) {
        const complexityText = getComplexity(options.complexity);
        itemComplexityP.innerText = complexityText;
        itemComplexitySelect.value = complexityText;
    }
    itemComplexityP.setAttribute('value', itemComplexitySelect.value);
    const itemButtons = listItem.appendChild(document.createElement('div'));
    itemButtons.classList.add('item-buttons');
    const buttonEdit = itemButtons.appendChild(document.createElement('img'));
    buttonEdit.src = "../assets/edit.svg";
    buttonEdit.alt = "Edit";
    buttonEdit.addEventListener('click', () => {
        itemAddressInput.value = itemAddressP.getAttribute('value');
        itemComplexitySelect.value = itemComplexityP.getAttribute('value');
        listItem.classList.add('editable');
        buttonEdit.classList.toggle('hidden');
        buttonDelete.classList.toggle('hidden');
        buttonApprove.classList.toggle('hidden');
        buttonCancel.classList.toggle('hidden');
    });
    const buttonDelete = itemButtons.appendChild(document.createElement('img'));
    buttonDelete.src = "../assets/delete-button.svg";
    buttonDelete.alt = "Delete";
    buttonDelete.addEventListener('click', async () => {
        const card = listItem.parentElement.parentElement.parentElement;
        await query('master', 'POST', {
            itemId: id,
            remove: true,
            application: {
                remove: true
            }
        }, {
            id: card.id,
            applicationId: id
        });
        card.setAttribute('applications-last-count', (+card.getAttribute('applications-last-count')
            + Number(getComplexity(itemComplexitySelect.value))).toString());
        card.querySelector('.applications-last-count').textContent = card.getAttribute('applications-last-count');
        listItem.remove();
    });
    const buttonApprove = itemButtons.appendChild(document.createElement('img'));
    buttonApprove.src = "../assets/approve.png";
    buttonApprove.alt = "Approve";
    buttonApprove.addEventListener('click', async () => {
        const card = listItem.parentElement.parentElement.parentElement;
        if (!validateString(itemAddressInput.value)) {
            const text = itemAddressInput.parentElement.previousElementSibling.textContent;
            alert(`Не заполнено поле ${text.trim().slice(0, text.length - 1)}`);
            return;
        }
        let validationResult;
        let count;
        if (listItem.getAttribute('edited') === 'true') {
            const uuid = listCont.parentElement.parentElement.id;
            if (listItem.id) {
                count = -Number(getComplexity(itemComplexitySelect.value)) + Number(getComplexity(itemComplexityP.innerText));
                validationResult = validateCount(card, count);
                if (!validationResult) {
                    alert(`Недостаточно места.\n ` +
                        `Оставшийся эквивалент сложности - ${card.getAttribute('applications-last-count')}.`);
                    return;
                }
                await query('application', 'POST', {
                    address: itemAddressInput.value,
                    complexity: getComplexity(itemComplexitySelect.value)
                }, {
                    id: id
                });
            }
            else {
                count = -Number(getComplexity(itemComplexitySelect.value));
                validationResult = validateCount(card, count);
                if (!validationResult) {
                    alert(`Недостаточно места.\n ` +
                        `Оставшийся эквивалент сложности - ${card.getAttribute('applications-last-count')}.`);
                    return;
                }
                await query('master', 'POST', {
                    itemId: id,
                    application: {
                        id: id,
                        address: itemAddressInput.value,
                        complexity: getComplexity(itemComplexitySelect.value)
                    }
                }, {
                    id: uuid,
                    applicationId: id
                });
            }
            card.setAttribute('applications-last-count', (+card.getAttribute('applications-last-count') + count).toString());
            itemAddressP.innerText = itemAddressInput.value;
            itemComplexityP.innerText = itemComplexitySelect.value;
            itemAddressP.setAttribute('value', itemAddressInput.value);
            itemComplexityP.setAttribute('value', itemComplexitySelect.value);
            card.querySelector('.applications-last-count').textContent = card.getAttribute('applications-last-count');
            listItem.id = id;
            enableDragAndDropListItem(listItem);
        }
        listItem.classList.remove('editable');
        listItem.setAttribute('edited', 'false');
        buttonEdit.classList.toggle('hidden');
        buttonDelete.classList.toggle('hidden');
        buttonApprove.classList.toggle('hidden');
        buttonCancel.classList.toggle('hidden');
    });
    const buttonCancel = itemButtons.appendChild(document.createElement('img'));
    buttonCancel.src = "../assets/cancel.png";
    buttonCancel.alt = "Cancel";
    buttonCancel.addEventListener('click', () => {
        if (listItem.id) {
            listItem.classList.remove('editable');
            itemAddressInput.value = itemAddressP.getAttribute('value');
            itemComplexitySelect.value = itemComplexityP.getAttribute('value');
            buttonEdit.classList.toggle('hidden');
            buttonDelete.classList.toggle('hidden');
            buttonApprove.classList.toggle('hidden');
            buttonCancel.classList.toggle('hidden');
        }
        else {
            listItem.remove();
        }
    });
    if (options) {
        buttonApprove.classList.add('hidden');
        buttonCancel.classList.add('hidden');
        li.setAttribute('applications-last-count', (+li.getAttribute('applications-last-count')
            - Number(getComplexity(itemComplexitySelect.value))).toString());
    }
    else {
        buttonEdit.classList.add('hidden');
        buttonDelete.classList.add('hidden');
    }
    listCont.appendChild(listItem);
}
async function createListElement(options) {
    const list = document.querySelector('.cards-list');
    const li = document.createElement('li');
    li.classList.add('card');
    li.id = options.id;
    li.setAttribute('applications-last-count', N.toString());
    const id = document.createElement('div');
    id.innerText = `ID: ${options.id}`;
    li.appendChild(id);
    const mainInfo = document.createElement('div');
    mainInfo.classList.add('main-info');
    let p = mainInfo.appendChild(document.createElement('p'));
    p.innerText = 'Основная информация';
    const buttonsMain = document.createElement('div');
    buttonsMain.classList.add('buttons');
    const buttonEdit = buttonsMain.appendChild(document.createElement('img'));
    buttonEdit.src = '../assets/edit.svg';
    buttonEdit.alt = 'edit';
    buttonEdit.addEventListener('click', () => {
        info.classList.toggle('editable');
        buttonEdit.classList.toggle('hidden');
        buttonApprove.classList.toggle('hidden');
        buttonCancel.classList.toggle('hidden');
    });
    const buttonApprove = buttonsMain.appendChild(document.createElement('img'));
    buttonApprove.src = '../assets/approve.png';
    buttonApprove.alt = 'edit';
    buttonApprove.classList.add('hidden');
    buttonApprove.addEventListener('click', async () => {
        if (info.getAttribute('edited') === 'true') {
            const items = li.querySelectorAll('.list-item .item-complexity p:not(.title)');
            let applicationComp = 0;
            items.forEach(item => applicationComp += +item.getAttribute('value'));
            console.log('test');
            await query('master', 'POST', {
                fullname: fullnameInput.value
            }, {
                id: options.id
            });
            fullnameP.innerText = fullnameInput.value;
            fullnameP.setAttribute('value', fullnameInput.value);
            li.setAttribute('applications-last-count', (N - applicationComp).toString());
            li.querySelector('.applications-last-count').textContent = li.getAttribute('applications-last-count');
        }
        info.setAttribute('edited', 'false');
        info.classList.toggle('editable');
        buttonEdit.classList.toggle('hidden');
        buttonApprove.classList.toggle('hidden');
        buttonCancel.classList.toggle('hidden');
    });
    const buttonCancel = buttonsMain.appendChild(document.createElement('img'));
    buttonCancel.src = '../assets/cancel.png';
    buttonCancel.alt = 'edit';
    buttonCancel.classList.add('hidden');
    buttonCancel.addEventListener('click', () => {
        info.classList.toggle('editable');
        if (info.getAttribute('edited') === 'true') {
            fullnameInput.value = fullnameInput.getAttribute('value');
        }
        buttonEdit.classList.toggle('hidden');
        buttonApprove.classList.toggle('hidden');
        buttonCancel.classList.toggle('hidden');
    });
    mainInfo.appendChild(buttonsMain);
    li.appendChild(mainInfo);
    const info = document.createElement('div');
    info.classList.add('info');
    info.setAttribute('edited', 'false');
    const fullname = document.createElement('div');
    const fullnameP = addRow(fullname, {
        name: 'ФИО',
        value: options.fullname,
        className: 'master-fullname'
    });
    const fullnameInput = addInput(fullname, {
        uuid: options.id,
        classes: ['inp'],
        label: 'city',
        labelName: '',
        type: 'string'
    });
    fullnameP.setAttribute('value', fullnameInput.value);
    fullnameInput.addEventListener('change', () => {
        info.setAttribute('edited', 'true');
    });
    info.appendChild(fullname);
    const applicationsCount = document.createElement('div');
    applicationsCount.classList.add('not-editable');
    const applicationsCountP = applicationsCount.appendChild(document.createElement('p'));
    applicationsCountP.classList.add('title');
    applicationsCountP.innerText = 'Оставшаяся сложность';
    p = applicationsCount.appendChild(document.createElement('p'));
    p.classList.add('applications-last-count');
    info.appendChild(applicationsCount);
    li.appendChild(info);
    const cardList = li.appendChild(document.createElement('div'));
    cardList.classList.add('card-list');
    const cardListP = cardList.appendChild(document.createElement('p'));
    cardListP.innerHTML = 'Список заявок:';
    const listCont = cardList.appendChild(document.createElement('div'));
    listCont.classList.add('list-cont');
    const addBtn = li.appendChild(document.createElement('button'));
    addBtn.classList.add('add-card-btn');
    addBtn.innerText = 'Добавить заявку';
    addBtn.addEventListener('click', () => {
        addItem(li, listCont);
    });
    const deleteBtn = li.appendChild(document.createElement('button'));
    deleteBtn.classList.add('delete-card-btn');
    deleteBtn.innerText = 'Убрать мастера';
    deleteBtn.addEventListener('click', async () => {
        await query('master', 'DELETE', undefined, { id: li.id });
        li.remove();
    });
    await addItems(li, listCont, options.applications);
    li.querySelector('.applications-last-count').innerText = li.getAttribute('applications-last-count');
    list.insertBefore(li, list.lastElementChild);
    return li;
}
async function addListElement() {
    const modal = document.querySelector('.modal');
    if (modal) {
        const content = modal.querySelector('.content');
        const fullname = addInput(content, {
            classes: ['title'],
            label: 'fullname',
            labelName: 'ФИО',
            type: 'string'
        });
        async function createNewListElement() {
            const uuid = crypto.randomUUID();
            await query('/master', 'PUT', {
                id: uuid,
                fullname: fullname.value
            });
            const li = await createListElement({
                id: uuid,
                fullname: fullname.value,
                applications: []
            });
            enableDragAndDropCard(li);
        }
        const modalButtons = modal.querySelector('.modal-buttons');
        const approveBtn = document.createElement('img');
        approveBtn.src = '../assets/approve.png';
        approveBtn.alt = 'Approve';
        approveBtn.id = 'approve';
        approveBtn.addEventListener('click', () => {
            try {
                createNewListElement();
                toggleModal();
            }
            catch (e) {
                window.alert(e.message);
            }
        });
        modalButtons.insertBefore(approveBtn, modalButtons.firstChild);
        toggleModal();
    }
}
function enableDragAndDropCard(card) {
    card.addEventListener('dragover', (e) => {
        e.preventDefault();
        card.classList.add('drag-over');
    });
    card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
    });
    card.addEventListener('drop', async (e) => {
        var _a;
        e.preventDefault();
        card.classList.remove('drag-over');
        const data = (_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.getData('text/plain');
        if (!data)
            return;
        const { itemId } = JSON.parse(data);
        const draggedItem = document.getElementById(itemId);
        const targetList = card.querySelector('.list-cont');
        if (draggedItem && targetList) {
            const cardId = card.id;
            if (!cardId)
                return;
            let validationResult;
            const item = document.getElementById(itemId);
            validationResult = validateCount(card, -Number(getComplexity(item.querySelector('.item-complexity p:not(.title)').innerText)));
            if (!validationResult) {
                alert(`Недостаточно места у Мастера.\n `);
                return;
            }
            if (!targetList.querySelector('.list-item')) {
                const placeholder = document.createElement('div');
                placeholder.classList.add('list-item-placeholder');
                targetList.appendChild(placeholder);
            }
            const sourceCard = draggedItem.closest('.card');
            const sourceCardId = sourceCard === null || sourceCard === void 0 ? void 0 : sourceCard.id;
            if (sourceCardId) {
                await query('/master', 'POST', {
                    itemId,
                    remove: true
                }, {
                    id: sourceCardId
                });
            }
            await query('/master', 'POST', {
                itemId,
            }, {
                id: cardId
            });
            targetList.appendChild(draggedItem);
            const placeholder = targetList.querySelector('.list-item-placeholder');
            if (placeholder)
                placeholder.remove();
            card.setAttribute('applications-last-count', (+card.getAttribute('applications-last-count')
                - +getComplexity(item.querySelector('.item-complexity p:not(.title)').getAttribute('value'))).toString());
            sourceCard.setAttribute('applications-last-count', (+sourceCard.getAttribute('applications-last-count')
                + +getComplexity(item.querySelector('.item-complexity p:not(.title)').getAttribute('value'))).toString());
            card.querySelector('.applications-last-count').textContent = card.getAttribute('applications-last-count');
            sourceCard.querySelector('.applications-last-count').textContent = sourceCard.getAttribute('applications-last-count');
        }
        else {
            alert('Невозможно перенести элемент.');
        }
    });
}
function enableDragAndDropListItem(item) {
    item.draggable = true;
    item.addEventListener('dragstart', (e) => {
        if (e.dataTransfer) {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                itemId: item.id
            }));
        }
        item.classList.add('dragging');
    });
    item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
    });
}
function enableDragAndDrop() {
    const listItems = document.querySelectorAll('.list-item');
    listItems.forEach(enableDragAndDropListItem);
    const cards = document.querySelectorAll('.card');
    cards.forEach(enableDragAndDropCard);
}
async function init() {
    const result = await query('allMasters', 'GET');
    const rows = await result.json();
    for (const row of rows) {
        await createListElement(row);
    }
    enableDragAndDrop();
}
