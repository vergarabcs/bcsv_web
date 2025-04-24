import { NextResponse } from 'next/server';
import { FormData, ValidationError } from '../../serverSideValidationApp/types';
import { validateFormData, delay } from '../../serverSideValidationApp/utils';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Simulate server processing delay
    await delay(1000);
    
    // Validate the form data
    const errors = validateFormData(body as FormData);
    
    // If there are validation errors, return a 400 response
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { errors, message: 'Validation failed' },
        { status: 400 }
      );
    }
    
    // Simulate additional server-side validation that can't be done client-side
    // For example, checking if an email is already in use
    if (body.email === 'test@example.com') {
      return NextResponse.json(
        { 
          errors: { email: 'This email address is already in use' },
          message: 'Validation failed' 
        },
        { status: 400 }
      );
    }
    
    // If validation passes, return a success response
    return NextResponse.json({
      success: true,
      data: body,
      message: 'Validation successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('API validation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}