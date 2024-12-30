import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        console.log('Sending request to server with email:', body.email);
        
        // Try to connect to the server
        try {
            const response = await fetch('http://localhost:9000/api/users/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                console.error('Server responded with status:', response.status);
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Server responded with status ${response.status}`);
            }

            const data = await response.json();
            console.log('Full server response:', JSON.stringify(data, null, 2));
            
            return NextResponse.json(data);
        } catch (fetchError) {
            console.error('Error connecting to backend server:', fetchError);
            return NextResponse.json(
                { 
                    state: false, 
                    message: 'Unable to connect to server. Please make sure the backend server is running on port 9000.' 
                },
                { status: 503 }
            );
        }
    } catch (error) {
        console.error('Forgot password API error:', error);
        return NextResponse.json(
            { state: false, message: 'An error occurred while processing your request' },
            { status: 500 }
        );
    }
}
