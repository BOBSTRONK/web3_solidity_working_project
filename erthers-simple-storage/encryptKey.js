const ethers = require("ethers");
const fs = require("fs");
require("dotenv").config();

async function main() {
  let wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  // this function is going to return an encrypted json key
  // that can be stored locally and that we can only decrypt it with the password
  let encryptedJsonKey = await wallet.encrypt(process.env.PRIVATE_KEY_PASSWORD);
  console.log(encryptedJsonKey);

  fs.writeFileSync("./.encryptedKey.json", encryptedJsonKey);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
