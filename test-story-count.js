// Test script to check story count
import fetch from 'node-fetch';

async function testStoryCount() {
  try {
    console.log('Testing story count API...');
    
    const response = await fetch('http://localhost:3000/api/debug-story-count');
    const data = await response.json();
    
    console.log('Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error testing story count:', error);
  }
}

testStoryCount();
