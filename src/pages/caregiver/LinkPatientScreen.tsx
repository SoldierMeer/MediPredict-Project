import api from '../../utils/api';
import { useUser } from '@/src/context/UserContext';
import { useState } from 'react';
import { RefreshCw, Clock, Send } from 'lucide-react';
import { cn } from '@/src/utils/cn';
import { useNavigate } from 'react-router-dom';

const LinkPatientScreen = () => {
    const { linkStatus, userId, setLinkStatus } = useUser();
    const [patientIdInput, setPatientIdInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleRefreshStatus = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/requests/status/check');
            console.log("Status Check Response:", res.data.status); // <--- DEBUG THIS

            const newStatus = res.data.status;

            // Update the context. This should trigger the App.tsx redirect.
            setLinkStatus(newStatus);

            if (newStatus === 'accepted') {
                alert("Connection Approved! Redirecting...");
                navigate('/caregiver/dashboard');
                // App.tsx should handle the redirect automatically now.
            } else if (newStatus === 'pending') {
                alert("Still pending. Ask your patient to check their Home screen.");
            } else {
                alert("No request found. Please try linking again.");
            }
        } catch (err) {
            console.error("Status Check Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // LinkPatientScreen.tsx

    const handleSendRequest = async () => {
        // ✅ Safety check: Don't send empty requests
        if (!patientIdInput.trim()) {
            alert("Please enter a Patient Code.");
            return;
        }

        try {
            // ✅ FIX: Use 'patientIdInput' (your state) instead of 'patientCode'
            // Wrap it in an object key that matches your controller (patientCode)
            await api.post('/requests/send', {
                patientCode: patientIdInput.trim()
            });

            setLinkStatus("pending");
            alert("Request sent! Please ask your patient to accept the link in their profile.");
        } catch (err: any) {
            // Standardize error message retrieval
            const msg = err.response?.data?.message || "Could not find patient.";
            alert(msg);
        }
    };

    if (linkStatus === "pending") {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
                <h2 className="text-2xl font-bold">Request Sent!</h2>
                <p className="text-gray-500 mt-2">Waiting for the patient to accept your invitation.</p>
                <div className="animate-pulse mt-4 bg-primary/20 p-4 rounded-full">🕒</div>

                <button
                    onClick={handleRefreshStatus}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                    <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
                    {isLoading ? "Checking..." : "Check Approval Status"}
                </button>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-xl font-bold">Link to a Patient</h1>
            <p className="text-sm text-gray-500 mb-6">Enter the Patient ID provided by your patient to begin caregiving.</p>
            <input
                className="w-full border p-3 rounded-lg"
                placeholder="e.g. MP-2948"
                value={patientIdInput}
                onChange={(e) => setPatientIdInput(e.target.value)}
            />
            <button onClick={handleSendRequest} className="w-full bg-primary text-white mt-4 py-3 rounded-xl">
                Send Link Request
            </button>
        </div>
    );
};

export default LinkPatientScreen