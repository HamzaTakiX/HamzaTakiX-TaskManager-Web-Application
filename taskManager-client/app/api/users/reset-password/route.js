import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        
        const response = await fetch('http://localhost:9000/api/users/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { state: false, message: 'An error occurred while resetting the password' },
            { status: 500 }
        );
    }
}
