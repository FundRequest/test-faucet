const commandLineArgs = require('command-line-args');
const optionDefinitions = [
  { name: 'tokenContractOwnerPrivateKey', type: String },
  { name: 'tokenContractOwnerAddress', type: String },
  { name: 'tokenContractAddress', type: String }
];
const options = commandLineArgs(optionDefinitions);

const TOKEN_CONTRACT_OWNER_PRIVATE_KEY = options.tokenContractOwnerPrivateKey;
const TOKEN_CONTRACT_OWNER_ADDRESS = options.tokenContractOwnerAddress;
const TOKEN_CONTRACT_ADDRESS = options.tokenContractAddress;

const Web3 = require('web3');
const contractJson = require('./contract.json');
const web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/oUKLnFRRrQsobQ1GG1PX"));

const EthereumTx = require('ethereumjs-tx');

const contract = new web3.eth.Contract(
  contractJson,
  TOKEN_CONTRACT_ADDRESS
);
const privateKey = new Buffer(TOKEN_CONTRACT_OWNER_PRIVATE_KEY, 'hex');

async function generateTokensFromContract(recipient) {
  const callData = contract.methods.generateTokens(recipient, 5000000000000000000).encodeABI();
  const gasPrice = await web3.eth.getGasPrice();
  const gasPriceHex = web3.utils.toHex(gasPrice);
  const nonce = await web3.eth.getTransactionCount(TOKEN_CONTRACT_OWNER_ADDRESS);
  const txParams = {
    nonce: web3.utils.toHex(nonce),
    gasPrice: gasPriceHex,
    from: TOKEN_CONTRACT_OWNER_ADDRESS,
    to: TOKEN_CONTRACT_ADDRESS,
    value: '0x00',
    data: callData,
    chainId: 4
  };

  const gasLimit = await web3.eth.estimateGas(txParams);
  txParams.gasLimit = web3.utils.toHex(gasLimit);
  const tx = new EthereumTx(txParams);
  tx.sign(privateKey);
  const serializedTx = tx.serialize();
  return await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));

}

const express = require('express');
const app = express();
const port = process.env.PORT || 3002;

app.listen(port);
console.log('Server started! At http://localhost:' + port);

app.get('/faucet', function (req, res) {

  const address = req.param('address');

  generateTokensFromContract(address)
    .then(function (f) {
      res.setHeader('Content-Type', 'text/plain');
      res.send("Transferring 5 FND to:" + address + '. For verification: https://rinkeby.etherscan.io/tx/' + f.transactionHash);
    }).catch(function (error) {
    res.status(500).send(error.message);
  });

});