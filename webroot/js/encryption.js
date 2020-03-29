class Encryption {
  hash(content) {
    return sodium.to_hex(sodium.crypto_generichash(64, content));
  }

  createKey() {
    return sodium.to_hex(sodium.randombytes_buf(256));
  }

  encrypt(message, password) {
    const key = sodium.crypto_generichash(sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES, password);
    const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
    const encrypted = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(message, null, nonce, nonce, key);
    return sodium.to_hex(nonce) + sodium.to_hex(encrypted);
  }

  decrypt(nonce_and_ciphertext, password) {
    const key = sodium.crypto_generichash(sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES, password);
    const length = sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES;
    const nonce = sodium.from_hex(nonce_and_ciphertext.substr(0, length * 2));
    const ciphertext = sodium.from_hex(nonce_and_ciphertext.substr(length * 2));
    var result = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(nonce, ciphertext, null, nonce, key, "text");
    return result;
  }

  passwordHash(password) {
    return sodium.crypto_pwhash_str(password, 3, 32768, "text");
  }

  passwordVerify(password, hash) {
    return sodium.crypto_pwhash_str_verify(hash, password);
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
    return list.owners.filter(o => o.userId === userId)[0];
  }
}
