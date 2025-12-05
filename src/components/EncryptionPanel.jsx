import React, { useState } from 'react';
import { generateMasterKey, encryptSecret, splitKey } from '../utils/cryptoUtils';

const EncryptionPanel = () => {
    const [secret, setSecret] = useState('');
    const [shares, setShares] = useState(5);
    const [threshold, setThreshold] = useState(3);
    const [result, setResult] = useState(null);

    const handleEncrypt = async () => {
        if (!secret) return;

        // 1. Generate Master Key
        const masterKeyHex = generateMasterKey();

        // 2. Encrypt the secret
        const encryptedVault = await encryptSecret(secret, masterKeyHex);

        // 3. Split the Master Key
        const keyShares = splitKey(masterKeyHex, parseInt(shares), parseInt(threshold));

        setResult({
            vault: encryptedVault,
            shares: keyShares
        });
    };

    return (
        <div className="panel">
            <h2>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Create Vault
            </h2>

            <div className="form-group">
                <label>Secret Message</label>
                <textarea
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder="Enter your sensitive data here..."
                />
            </div>

            <div className="form-group">
                <label>Total Shares (N): {shares}</label>
                <input
                    type="range"
                    min="2"
                    max="10"
                    value={shares}
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setShares(val);
                        if (threshold > val) setThreshold(val);
                    }}
                />
            </div>

            <div className="form-group">
                <label>Threshold (K): {threshold}</label>
                <input
                    type="range"
                    min="2"
                    max={shares}
                    value={threshold}
                    onChange={(e) => setThreshold(parseInt(e.target.value))}
                />
            </div>

            <button onClick={handleEncrypt}>Generate Vault</button>

            {result && (
                <div className="result-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label>Encrypted Vault (Public Safe)</label>
                        <button
                            onClick={() => navigator.clipboard.writeText(result.vault)}
                            style={{ padding: '2px 8px', fontSize: '0.8rem' }}
                        >
                            Copy Vault
                        </button>
                    </div>
                    <div className="share-item" style={{ wordBreak: 'break-all' }}>{result.vault}</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                        <label>Key Shares (Distribute These)</label>
                        <button
                            onClick={() => {
                                const data = JSON.stringify(result, null, 2);
                                const blob = new Blob([data], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'shamirs-vault-kit.json';
                                a.click();
                                URL.revokeObjectURL(url);
                            }}
                            style={{ padding: '4px 12px', fontSize: '0.9rem', background: '#4CAF50', color: 'white', border: 'none' }}
                        >
                            Download Vault Kit (JSON)
                        </button>
                    </div>
                    {result.shares.map((share, idx) => (
                        <div key={idx} className="share-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ wordBreak: 'break-all', flex: 1, textAlign: 'left' }}>Share #{idx + 1}: {share}</span>
                            <button
                                onClick={() => navigator.clipboard.writeText(share)}
                                style={{ padding: '2px 8px', fontSize: '0.8rem', flexShrink: 0, width: 'auto' }}
                            >
                                Copy
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EncryptionPanel;
