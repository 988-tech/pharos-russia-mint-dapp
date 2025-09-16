import { useEffect, useState } from "react";
import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0x513b4C3e12D99E6Ed487a31BAfCC52D8f842A857";
const ABI = [
  { "inputs": [], "name": "MAX_SUPPLY", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getNextTokenId", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "safeMint", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  // ...остальной ABI...
];

const PHAROS_NETWORK = {
  chainId: '0xA8230',
  chainName: 'Pharos Testnet',
  rpcUrls: ['https://pharos-testnet-rpc.altlayer.io'],
  nativeCurrency: { name: 'PHAR', symbol: 'PHAR', decimals: 18 },
  blockExplorerUrls: ['https://testnet.pharosnetwork.xyz/']
};

export default function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [supply, setSupply] = useState(0);
  const [maxSupply, setMaxSupply] = useState(10000);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { checkConnection(); }, []);
  useEffect(() => { if (contract) loadContractData(); }, [contract]);

  const checkConnection = async () => {
    if (window.ethereum && window.ethereum.selectedAddress) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        setProvider(provider); setSigner(signer); setAccount(address); setContract(contract);
      } catch (err) { console.log("Автоподключение не удалось:", err.message); }
    }
  };

  const connectWallet = async () => {
    if (connecting) return;
    setConnecting(true); setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (typeof window.ethereum === 'undefined') throw new Error('Ethereum кошелек не найден.');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      try {
        await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: PHAROS_NETWORK.chainId }] });
      } catch (switchError) {
        if (switchError.code === 4902) await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [PHAROS_NETWORK] });
        else throw switchError;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const network = await provider.getNetwork();
      if (network.chainId !== 688688n) throw new Error('Пожалуйста, переключитесь на Pharos Testnet');
      setProvider(provider); setSigner(signer); setAccount(address); setContract(contract);
    } catch (err) {
      setError(err.message || 'Ошибка подключения к кошельку.');
    } finally { setConnecting(false); }
  };

  const disconnectWallet = () => {
    setProvider(null); setSigner(null); setAccount(null); setContract(null); setError('');
  };

  // --- СЧЕТЧИК ---
  const loadContractData = async () => {
    if (!contract) return;
    try {
      const [nextTokenId, maxSupplyValue] = await Promise.all([
        contract.getNextTokenId(),
        contract.MAX_SUPPLY()
      ]);
      setSupply(Number(nextTokenId) - 1); // количество заминченных NFT
      setMaxSupply(Number(maxSupplyValue));
    } catch (err) {
      console.error("Ошибка загрузки данных контракта:", err);
    }
  };

  const mintNFT = async () => {
    if (!contract) return;
    try {
      const tx = await contract.safeMint({ gasLimit: 500000 });
      await tx.wait();
      await loadContractData();
      alert(`NFT успешно заминчен! Хэш транзакции: ${tx.hash}`);
    } catch (err) {
      alert(`Ошибка минта: ${err.message || 'Неизвестная ошибка'}`);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) disconnectWallet();
        else if (accounts[0] !== account) checkConnection();
      };
      const handleChainChanged = () => { window.location.reload(); };
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white flex flex-col">
      <div className="absolute inset-0 opacity-20">
        <img src="/PharosRussia.jpg" alt="Pharos Russia Background" className="w-full h-full object-cover" />
      </div>
      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-black/20 backdrop-blur-lg rounded-3xl p-8 border border-white/10 shadow-2xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-red-600 bg-clip-text text-transparent">
              Pharos Russia NFT
            </h1>
            <p className="text-gray-300 mb-4 text-sm">
              Минт русский NFT-значок на Pharos Testnet<br/>
              <span className="text-yellow-400">Бесплатно (только газ)</span>
            </p>
            <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
              <img src="/PharosRossia.png" alt="Pharos Russia NFT" className="w-32 h-32 mx-auto rounded-2xl shadow-lg" />
              <p className="text-xs text-gray-400 mt-2">Pharos Russia NFT</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400">Заминчено:</span>
                <span className="font-bold text-xl">{supply} / {maxSupply}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                <div className="bg-gradient-to-r from-yellow-400 to-red-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(supply / maxSupply) * 100}%` }}></div>
              </div>
              <p className="text-xs text-gray-400">
                Pharos Testnet • Бесплатный минт (только газ)
              </p>
            </div>
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-4">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
            {account ? (
              <div className="space-y-4">
                <button
                  onClick={mintNFT}
                  className="w-full bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Минт NFT 🎨
                </button>
                <button
                  onClick={disconnectWallet}
                  className="w-full bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-xl text-sm transition-all duration-200"
                >
                  Отключить кошелёк
                </button>
                <p className="mt-3 text-xs break-all text-gray-400">
                  Подключен: {account.slice(0, 6)}...{account.slice(-4)}
                </p>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={connecting}
                className={`w-full px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg ${
                  connecting 
                    ? "bg-gray-500 cursor-not-allowed" 
                    : "bg-blue-600 hover:bg-blue-700 hover:shadow-xl"
                }`}
              >
                {connecting ? "Подключение..." : "Подключить кошелёк"}
              </button>
            )}
            <div className="mt-4">
              <a href="https://t.me/hrumdrops" target="_blank" rel="noopener noreferrer"
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                📱 Русскоговорящее сообщество Pharos
              </a>
              <p className="text-xs text-gray-400 mt-1 text-center">
                Присоединяйтесь к нашему Telegram каналу
              </p>
            </div>
            <div className="mt-6 text-xs text-gray-500 space-y-1">
              <p>💡 Поддерживается: MetaMask, OKX, Rabby, Bitget</p>
              <p>🌐 Сеть: Pharos Testnet (Chain ID: 688688)</p>
              <p>💰 Бесплатно (только газ)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
