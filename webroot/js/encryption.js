class Encryption {
  hash(content) {
    return sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(content));
  }

  createKey() {
    return sjcl.codec.hex.fromBits(sjcl.random.randomWords(100));
  }

  encrypt(message, password) {
    return sjcl.encrypt(password, message);
  }

  decrypt(ciphertext, password) {
    return sjcl.decrypt(password, ciphertext);
  }

  encryptListData(listData, userId, masterKey, generateKey = false) {
    const listKey = generateKey ? this.createKey() : this.decryptListKey(listData, userId, masterKey);
    if (generateKey) {
      listData.key = this.encrypt(listKey, masterKey);
    }
    const copy = Object.assign({}, listData);
    copy.name = this.encrypt(copy.name, listKey);
    if (copy.folder) {
      copy.folder = this.encrypt(copy.folder, listKey);
    }
    return copy;
  }

  encryptItemData(itemData, listData, userId, masterKey) {
    const copy = Object.assign({}, itemData);
    const listKey = this.decryptListKey(listData, userId, masterKey);
    if (copy.task) {
      copy.task = this.encrypt(copy.task, listKey);
    }
    if (copy.notes) {
      copy.notes = this.encrypt(copy.notes, listKey);
    }
    return copy;
  }

  decryptListData(listData, userId, masterKey) {
    const listKey = this.decryptListKey(listData, userId, masterKey);
    if (listKey) {
      listData.name = this.decrypt(listData.name, listKey);
    } else {
      listData.nokey = true;
      const ownerData = this.findOwnerInfo(listData, userId);
      listData.name = ownerData.listName + " von " + ownerData.sharedBy;
    }
    return listData;
  }

  decryptItemData(itemData, listData, userId, masterKey) {
    itemData.task = this.decrypt(itemData.task, this.decryptListKey(listData, userId, masterKey));
    if (itemData.notes) {
      itemData.notes = this.decrypt(itemData.notes, this.decryptListKey(listData, userId, masterKey));
    }
    return itemData;
  }

  decryptListKey(listData, userId, masterKey) {
    const listKey = this.findOwnerInfo(listData, userId).key;
    if (!listKey) {
      return undefined;
    }
    return this.decrypt(listKey, masterKey);
  }

  findOwnerInfo(list, userId) {
    return list.owners.filter((o) => o.userId === userId)[0];
  }
}
