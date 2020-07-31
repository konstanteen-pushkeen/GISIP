'use strict';

import _ from './node_modules/lodash-es/lodash.js';

class Branch {
    constructor(id) {
        this.id = id;
        this.child_ids = [];
    }
}

function fetchData(url) {
    const request = fetch(url)
        .then(r => r.json())
        .catch(err => console.info(err));
    return request;
}

function getUniqCode(arr) {
    let codes = [];
    arr.forEach(obj => codes.push(obj.code));
    const uniqCodes = _.uniq(codes);

    return uniqCodes;
}

function getOtherCodes(arr_1, arr_2) {
    const codesArr_1 = getUniqCode(arr_1);
    const codesArr_2 = getUniqCode(arr_2);

    let otherCodes = [];

    codesArr_1.forEach(code => {
        if (!codesArr_2.includes(code)) otherCodes.push(code);
    });

    return otherCodes;
}

function getProperty(arr, prop) {
    let propertys = [];
    arr.forEach(obj => propertys.push(obj[`${prop}`]));
    const uniqPropertys = _.uniq(propertys).sort((a, b) => a - b);

    return uniqPropertys;
}

function findParent(parent) {
    parent.forEach(obj => {
        const { child_ids } = obj;

        if (!child_ids) return;

        child_ids.forEach(child => {
            const branch = parent.find(item => item.id === child.id);

            if (branch) {
                child.child_ids = branch.child_ids;
            }
        });

        findParent(child_ids);
    });
}

function createStructureTree(structure) {
    const structure_PARENT_ID = getProperty(structure, 'parent_id');
    const arrBranches = structure_PARENT_ID.map(id => new Branch(id));

    structure.forEach(obj => {
        const { id, parent_id, name, code } = obj;
        const branch = arrBranches.find(br => br.id === parent_id);

        branch.child_ids.push({
            id: id,
            name: name,
            code: code
        });
    });

    arrBranches.forEach(obj => {
        const { id } = obj;
        const layer = structure.find(l => l.id === id);

        if (layer) {
            obj.code = layer.code;
            obj.name = layer.name;
        }
    });

    findParent(arrBranches);

    return arrBranches;
}

function createElement_UL(code, name, id, other_codes) {
    const ul = document.createElement('ul');
    ul.classList.add('parent');
    ul.setAttribute('parent_id', id);

    const span = document.createElement('span');
    const text = !code && !name ? `${id}` : `${name}: ${code}`;

    span.classList.add('title');
    if (other_codes && other_codes.includes(code)) span.classList.add('code');
    span.append(text);

    ul.append(span);

    return ul;
}

function createElement_LI(code, name, id, other_codes) {
    const li = document.createElement('li');
    const text = !code && !name ? `${id}` : `${name}: ${code}`;

    li.classList.add('child');
    if (other_codes && other_codes.includes(code)) li.classList.add('code');
    li.setAttribute('child_id', id);
    li.append(text);

    return li;
}

function createTree(arr, container, other_codes) {
    arr.forEach(branch => {
        const { id, code, name, child_ids } = branch;
        let ul = createElement_UL(code, name, id, other_codes);        

        if (child_ids) {
            child_ids.forEach(child => {
                const { id, code, name, child_ids } = child;
                let li = createElement_LI(code, name, id, other_codes);

                if (child_ids) {
                    li = createElement_UL(code, name, id, other_codes);  
                    createTree(child_ids, li, other_codes);
                }

                ul.append(li);
            });
        } else {
            ul = createElement_LI(code, name, id, other_codes);
        }

        container.append(ul);
    });
}

window.onload = async function () {
    const parks_ind = await fetchData('https://orbismap.gisip.ru/api/2.0/oms_gisip_docker/gisip/layers/parks_ind/structure/');
    const parks_tech = await fetchData('https://orbismap.gisip.ru/api/2.0/oms_gisip_docker/gisip/layers/parks_tech/structure/');

    const otherCodes_parks_ind = getOtherCodes(parks_ind, parks_tech);
    const otherCodes_parks_tech = getOtherCodes(parks_tech, parks_ind);

    const parks_ind_ST = createStructureTree(parks_ind);
    const parks_tech_ST = createStructureTree(parks_tech);

    const container_parks_ind = document.querySelector('#container-parks_ind');
    const container_parks_tech = document.querySelector('#container-parks_tech');

    createTree([ parks_ind_ST[0] ], container_parks_ind, otherCodes_parks_ind);
    createTree([parks_tech_ST[0]], container_parks_tech, otherCodes_parks_tech);
}
