import { ethers, Contract } from 'ethers';

function getOrThrowFromEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const clientId = getOrThrowFromEnv('CLIENT_ID');
export const accessToken = getOrThrowFromEnv('CLIENT_ACCESS_TOKEN');
export const redirectUri = getOrThrowFromEnv('CLIENT_REDIRECT_URI');

export const identityProviderUri = getOrThrowFromEnv('IDENTITY_PROVIDER_URL');

export const authorizationEndpoint = `${identityProviderUri}/auth`;
export const tokenEndpoint = `${identityProviderUri}/token`;

export const custodialSignerUrl = getOrThrowFromEnv('CUSTODIAL_SIGNER_URL');

export const ethJsonRpcProviderUrl = getOrThrowFromEnv('ETH_JSON_RPC_URL');
export const ethReceiverAddress = getOrThrowFromEnv('ETH_RECEIVER_ADDRESS');
export const ethChainId = getOrThrowFromEnv('ETH_CHAIN_ID');

// Used for mixpanel tracking
export const mixpanelProjectToken = 'dfb084e3ff87f5aed5d21cc88ec38a7e';
export const rootJsonRpcProviderUrl = getOrThrowFromEnv('ROOT_JSON_RPC_URL');
export const rootReceiverAddress = getOrThrowFromEnv('ROOT_RECEIVER_ADDRESS');
export const rootChainId = getOrThrowFromEnv('ROOT_CHAIN_ID');

// Used for test transaction
export const transaction_to_address =
  '0xa4593663bD1c96dc04799b4f21f2F8ef6834f874'; // make sure you have enough balance in this wallet
export const transaction_chain_id = '11155111';

export const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function allowance(address owner, address spender) public view returns (uint256)',
  'function balanceOf(address who) public view returns (uint256)',
  'function name() public view returns (string memory)',
  'function symbol() public view returns (string memory)',
  'function decimals() public view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function transfer(address who, uint256 amount)',
  'function transferFrom(address from, address to, uint256 amount)',
];

export const XRP_PRECOMPILE_ADDRESS =
  '0xCCCCCCCC00000002000000000000000000000000';

export const ROOT_PRECOMPILE_ADDRESS =
  '0xcCcCCccC00000001000000000000000000000000';

export type TransactionType = 'eth' | 'root';

export const providers: Record<TransactionType, ethers.JsonRpcProvider> = {
  eth: new ethers.JsonRpcProvider(ethJsonRpcProviderUrl),
  root: new ethers.JsonRpcProvider(rootJsonRpcProviderUrl),
};

export const xrpERC20Precompile = new Contract(
  XRP_PRECOMPILE_ADDRESS,
  ERC20_ABI,
  providers['root']
);
export const rootERC20Precompile = new Contract(
  ROOT_PRECOMPILE_ADDRESS,
  ERC20_ABI,
  providers['root']
);
