// Section Creation Debugging Utilities

// Test section creation API endpoint with safe fallback
export const testSectionCreation = async (groupId: string, sectionName: string, useSafeEndpoint = true) => {
  try {
    console.log('Frontend - Testing section creation:', { groupId, sectionName, useSafeEndpoint });
    
    const endpoint = useSafeEndpoint ? `/api/groups/${groupId}/sections-safe` : `/api/groups/${groupId}/sections`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: sectionName })
    });
    
    console.log('Frontend - Response status:', response.status);
    console.log('Frontend - Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Frontend - Error response:', errorData);
      throw new Error(`Failed to create section: ${response.status} - ${errorData}`);
    }
    
    const newSection = await response.json();
    console.log('Frontend - Created section:', newSection);
    
    return newSection;
  } catch (error) {
    console.error('Frontend - Create section error:', error);
    throw error;
  }
};

// Test the debug endpoint
export const testDebugEndpoint = async () => {
  try {
    console.log('Frontend - Testing debug endpoint');
    
    const response = await fetch('/api/debug/sections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: 'debug data', timestamp: new Date().toISOString() })
    });
    
    console.log('Frontend - Debug response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Frontend - Debug error response:', errorData);
      throw new Error(`Debug endpoint failed: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Frontend - Debug result:', result);
    
    return result;
  } catch (error) {
    console.error('Frontend - Debug endpoint error:', error);
    throw error;
  }
};

// Get all sections for a group
export const getSectionsForGroup = async (groupId: string) => {
  try {
    console.log('Frontend - Fetching sections for group:', groupId);
    
    const response = await fetch(`/api/groups/${groupId}/sections`);
    
    console.log('Frontend - Get sections response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Frontend - Get sections error:', errorData);
      throw new Error(`Failed to get sections: ${response.status}`);
    }
    
    const sections = await response.json();
    console.log('Frontend - Sections for group:', sections);
    
    return sections;
  } catch (error) {
    console.error('Frontend - Get sections error:', error);
    throw error;
  }
};

// Test user authentication status
export const testUserAuth = async () => {
  try {
    console.log('Frontend - Testing user authentication status');
    
    const response = await fetch('/api/debug/sections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ authTest: true })
    });
    
    console.log('Frontend - Auth test response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Frontend - Auth test error:', errorData);
      throw new Error(`Auth test failed: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Frontend - Auth test result:', result);
    
    return result;
  } catch (error) {
    console.error('Frontend - Auth test error:', error);
    throw error;
  }
};

// Make these functions available globally for testing in browser console
declare global {
  interface Window {
    sectionDebugger: {
      testSectionCreation: typeof testSectionCreation;
      testDebugEndpoint: typeof testDebugEndpoint;
      getSectionsForGroup: typeof getSectionsForGroup;
      testUserAuth: typeof testUserAuth;
    };
  }
}

if (typeof window !== 'undefined') {
  window.sectionDebugger = {
    testSectionCreation,
    testDebugEndpoint,
    getSectionsForGroup,
    testUserAuth,
  };
}