import React, { useState } from 'react';
import { combineShares, decryptSecret } from '../utils/cryptoUtils';

const DecryptionPanel = () => {
    const [vaultData, setVaultData] = useState('');
    const [shareInputs, setShareInputs] = useState(['', '', '']);
    const [decryptedSecret, setDecryptedSecret] = useState('');
    const [error, setError] = useState('');

    const handleAddShare = () => {
        setShareInputs([...shareInputs, '']);
    };

    const handleRemoveShare = (index) => {
        const newShares = shareInputs.filter((_, i) => i !== index);
        setShareInputs(newShares);
    };

    const handleShareChange = (index, value) => {
        const newShares = [...shareInputs];
        newShares[index] = value;
        setShareInputs(newShares);
    };

    const handleDecrypt = async () => {
        setError('');
        setDecryptedSecret('');

        try {
            // Filter empty shares
            const validShares = shareInputs.filter(s => s.trim() !== '');

            if (validShares.length < 2) {
                setError("Need at least 2 shares to attempt reconstruction.");
                return;
            }

            // 1. Reconstruct Master Key
            const masterKeyHex = combineShares(validShares);

            // 2. Decrypt Secret
            const secret = await decryptSecret(vaultData, masterKeyHex);
            setDecryptedSecret(secret);
        } catch (err) {
            setError("Failed to decrypt! Either the shares are incorrect, insufficient, or the vault data is corrupted.");
        }
    };

    return (
        <div className="panel">
            <h2>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                </svg>
                Unlock Vault
            </h2>

            <div className="form-group">
                <label>Encrypted Vault Data</label>
                <textarea
                    value={vaultData}
                    onChange={(e) => setVaultData(e.target.value)}
                    placeholder="Paste the encrypted vault string here..."
                />
            </div>

            <div className="form-group">
                <label>Enter Shares (Need K shares)</label>
                {shareInputs.map((share, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                            type="text"
                            value={share}
                            onChange={(e) => handleShareChange(idx, e.target.value)}
                            placeholder={`Paste Share #${idx + 1}`}
                        />
                        {shareInputs.length > 2 && (
                            <button
                                onClick={() => handleRemoveShare(idx)}
                                style={{ width: 'auto', padding: '0 1rem', background: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                X
                            </button>
                        )}
                    </div>
                ))}
                <button
                    onClick={handleAddShare}
                    style={{ background: '#e5e7eb', color: '#374151', marginTop: '0.5rem', fontSize: '0.9rem', boxShadow: 'none' }}
                >
                    + Add Another Share Slot
                </button>
            </div>

            <button onClick={handleDecrypt}>Unlock Vault</button>

            {error && <div className="error">{error}</div>}

            {decryptedSecret && (
                <div className="result-box success">
                    <label>🎉 SECRET REVEALED 🎉</label>
                    <div style={{ fontSize: '1.5rem', marginTop: '1rem', wordBreak: 'break-all' }}>
                        {decryptedSecret}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DecryptionPanel;
