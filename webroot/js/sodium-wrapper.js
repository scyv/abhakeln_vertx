class SodiumWrapper {

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

}
