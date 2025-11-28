import React from 'react';
import EncryptionPanel from './components/EncryptionPanel';
import DecryptionPanel from './components/DecryptionPanel';

function App() {
    return (
        <div className="container">
            <div>
                <h1>Shamir's Vault</h1>
                <div className="subtitle">Distributed Secret Sharing System • AES-256-GCM • Client-Side Only</div>
            </div>

            <div className="panels">
                <EncryptionPanel />
                <DecryptionPanel />
            </div>

            <div style={{ textAlign: 'center', color: '#555', marginTop: '2rem' }}>
                <p>
                    How it works: The secret is encrypted with a random Master Key.
                    The Master Key is split into N shares using Shamir's Secret Sharing.
                    You need K shares to mathematically reconstruct the key and decrypt the secret.
                </p>
            </div>
        </div>
    );
}

export default App;
