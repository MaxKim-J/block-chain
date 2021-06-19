const CryptoJS = require("crypto-js");
const merkle = require("merkle");
const fs = require("fs");

// 블록 구조
class BlockHeader {
  constructor(version, index, previousHash, timestamp, merkleRoot) {
    this.version = version;
    this.index = index;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.merkleRoot = merkleRoot;
  }
}

class Block {
  constructor(header, data) {
    this.header = header;
    this.data = data;
  }
}

// 해쉬함수
const calculateHash = (version, index, previousHash, timestamp, merkleRoot) => {
  // 헤더를 모두 갈아서 해쉬 문자열을 만듬
  return CryptoJS.SHA256(version + index + previousHash + timestamp + merkleRoot).toString().toUpperCase()
}

// 블락에서 해쉬 추출
const calculateHashForBlock = (block) => {
  return calculateHash(
    block.header.version,
    block.header.index,
    block.header.previousHash,
    block.header.timestamp,
    block.header.merkleRoot,
  )
}

const getGenesisBlock = () => {
  const version = "1.0.0";
  const index = 0;
  const previousHash = '0'.repeat(64);
  const timeStamp = 1231006505;
  const data = ["얼마를 어디에서 어디로 출금했음"]

  const merkleTree = merkle("sha256").sync(data);
  const merkleRoot = merkleTree.root() || '0'.repeat(64)
  const header = new BlockHeader(version, index, previousHash, timeStamp, merkleRoot);

  return new Block(header, data);
}

// 초기 상태
const blockChain = [getGenesisBlock()];

// 블록 추가 로직
const getCurrentVersion = () => {
  const packageJson = fs.readFileSync("./package.json");
  const currentVersion = JSON.parse(packageJson).version;
  return currentVersion;
}

const getCurrentTimeStamp = () => {
  return Math.round(new Date().getTime() / 1000);
}

const generateNextBlock = (blockData) => {
  const previousBlock = getLatestBlock();
  const currentVersion = getCurrentVersion();

  const newIndex = previousBlock.header.index + 1;
  const previousHash = calculateHashForBlock(previousBlock);

  // 이러면 뭐지 트리에 추가되는건가 + 블록에 뭐 하나가 들어갔으니 머클 트리가 모두 바뀜
  const merkleTree = merkle('sha256').sync(blockData); 
  const merkleRoot = merkleTree.root() || '0'.repeat(64);

  const header = new BlockHeader(version, index, previousHash, timeStamp, merkleRoot);

  return new Block(newBlockHeader, blockData);
}

const isValidBlockStructure = (block) => {
  return typeof(block.header.version) === 'string' // ...이외에 그냥 타입 밸리데이션 로직
}


const isValidNewBlock = (newBlock, previousBlock) => {
  // 블록이 구조에 맞게 생성되지 않았을때 + 이거는 타입스크립트로 했으면 그냥 됐었겟군
  if (!isValidNewBlockStructure(newBlock)) {
    console.log('invalid block structure');
    return false;
  } else if (previousBlock.header.index + 1 !== newBlock.header.index) { // 인덱스가 다음게 아닐때
    console.log('invalid index');
    return false;
  } else if (calculateHashForBlock(previousBlock) !== newBlock.header.previousHash) { // 이전의 해쉬값을 제대로 참조하고 있지 못할때
    console.log('invalid previousHash');
    return false;
  } else if (newBlock.data.length !== 0 && (merkle("sha256").sync(newBlock.data).root() !== newBlock.header.merkleRoot) // 머클루트가 같지 않을때
      || (newBlock.data.length === 0 && ('0'.repeat(64) !== newBlock.header.merkleRoot)))) {
        console.log('invalid merkle root');
        return false
  }

  return true
}

const addBlock = (newBlock) => {
  if (isValidNewBlock(newBlock, getLatestBlock())) {
    blockChain.push(newBlock);
    return true;
  }
  return false;
}