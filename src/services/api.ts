
import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

const API_BASE_URL =
  'http://192.168.1.121:8080/api';


// ========================================================
// USER
// ========================================================

export interface User {
  id: number;
  fullName: string;
  email: string;
  mobileNumber: string;
  role: string;
  enabled: boolean;
}


// ========================================================
// LOGIN RESPONSE
// ========================================================

export interface LoginResponse {
  token: string;
  user: User;
}


// ========================================================
// CONTRIBUTION
// ========================================================

export interface Contribution {
  id: number;
  contributorId?: number;
  mentorId?: number | null;
  contributorName: string;
  mobileNumber?: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  verificationStatus: string;
  transactionId?: string | null;
  photoUrl: string | null;
  notes?: string;
  createdAt: string;
  verifiedAt?: string | null;
  verifiedBy?: number | null;
}
// ========================================================
// GALLERY PHOTO
// ========================================================

export interface GalleryPhoto {
  id: string;
  fileName: string;
  url: string;
}

// ========================================================
// GET GALLERY PHOTOS
// ========================================================

export async function getGalleryPhotos(
  token: string
): Promise<GalleryPhoto[]> {

  console.log('--------------------------------');
  console.log('GET GALLERY PHOTOS START');

  const url =
    `${API_BASE_URL}/upload/photos`;

  console.log(
    'GALLERY PHOTOS URL:',
    url
  );

  try {

    const response =
      await fetch(
        url,
        {
          method: 'GET',

          headers: {
            Authorization:
              `Bearer ${token}`,

            'Content-Type':
              'application/json',
          },
        }
      );

    console.log(
      'GALLERY PHOTOS STATUS:',
      response.status
    );

    const responseText =
      await response.text();

    console.log(
      'GALLERY PHOTOS RESPONSE:',
      responseText
    );

    if (!response.ok) {

      throw new Error(
        responseText ||
        'Failed to load gallery photos'
      );
    }

    const data =
      JSON.parse(responseText);

    if (!Array.isArray(data)) {

      throw new Error(
        'Invalid gallery photos response'
      );
    }

    const backendOrigin =
      API_BASE_URL.replace(
        /\/api\/?$/,
        ''
      );

    const photos: GalleryPhoto[] =
      data.map(
        (photo: any) => {

          const rawUrl =
            String(
              photo.url ||
              photo.imageUrl ||
              ''
            );

          const fullUrl =
            rawUrl.startsWith('http://') ||
            rawUrl.startsWith('https://')
              ? rawUrl
              : `${backendOrigin}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

          return {
            id: String(
              photo.id ||
              photo.fileName
            ),

            fileName:
              String(
                photo.fileName ||
                photo.id
              ),

            url:
              fullUrl,
          };
        }
      );

    console.log(
      'GALLERY PHOTOS COUNT:',
      photos.length
    );

    console.log(
      'GALLERY PHOTOS:',
      JSON.stringify(photos)
    );

    console.log('--------------------------------');

    return photos;

  } catch (error) {

    console.error(
      'GET GALLERY PHOTOS ERROR:',
      error
    );

    console.log('--------------------------------');

    throw error;
  }
}
// ========================================================
// RAZORPAY ORDER RESPONSE
// ========================================================

export interface RazorpayOrderResponse {
  orderId: string;
  receipt: string;
  amount: number;
  keyId: string;
  currency: string;
}


// ========================================================
// RAZORPAY VERIFICATION RESPONSE
// ========================================================

export interface RazorpayVerificationResponse {
  message: string;
  orderId: string;
  paymentId: string;
  amount: number;
  status: string;
  contribution: Contribution;
}


// ========================================================
// SEND OTP
// ========================================================

export async function sendOtp(
  mobileNumber: string
): Promise<string> {

  console.log('--------------------------------');
  console.log('LOG Sending OTP...');

  console.log(
    'OTP MOBILE:',
    mobileNumber
  );

  const url =
    `${API_BASE_URL}/auth/send-otp`;

  console.log(
    'OTP URL:',
    url
  );

  try {

    const response =
      await fetch(
        url,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            mobileNumber,
          }),
        }
      );

    console.log(
      'OTP RESPONSE STATUS:',
      response.status
    );

    const responseText =
      await response.text();

    console.log(
      'OTP RESPONSE:',
      responseText
    );

    if (!response.ok) {

      throw new Error(
        responseText ||
        'Failed to send OTP'
      );
    }

    console.log(
      'OTP SENT SUCCESSFULLY'
    );

    console.log('--------------------------------');

    return responseText;

  } catch (error) {

    console.error(
      'OTP SEND ERROR:',
      error
    );

    console.log('--------------------------------');

    throw error;
  }
}


// ========================================================
// VERIFY OTP
// ========================================================

export async function verifyOtp(
  mobileNumber: string,
  otp: string
): Promise<LoginResponse> {

  console.log('--------------------------------');
  console.log('VERIFY OTP START');

  const url =
    `${API_BASE_URL}/auth/verify-otp`;

  console.log(
    'VERIFY OTP URL:',
    url
  );

  try {

    const response =
      await fetch(
        url,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            mobileNumber,
            otp,
          }),
        }
      );

    console.log(
      'VERIFY OTP STATUS:',
      response.status
    );

    const responseText =
      await response.text();

    console.log(
      'VERIFY OTP RESPONSE:',
      responseText
    );

    if (!response.ok) {

      throw new Error(
        responseText ||
        'OTP verification failed'
      );
    }

    const data =
      JSON.parse(responseText);

    console.log(
      'LOGIN SUCCESS'
    );

    console.log(
      'USER:',
      JSON.stringify(data.user)
    );

    console.log('--------------------------------');

    return data;

  } catch (error) {

    console.error(
      'VERIFY OTP ERROR:',
      error
    );

    console.log('--------------------------------');

    throw error;
  }
}


// ========================================================
// GET ADMIN USERS
// ========================================================

export async function getAdminUsers(
  token: string
): Promise<User[]> {

  const response =
    await fetch(
      `${API_BASE_URL}/admin/users`,
      {
        method: 'GET',

        headers: {
          Authorization:
            `Bearer ${token}`,

          'Content-Type':
            'application/json',
        },
      }
    );

  const responseText =
    await response.text();

  if (!response.ok) {

    throw new Error(
      responseText ||
      'Failed to load users'
    );
  }

  return JSON.parse(responseText);
}


// ========================================================
// GET USERS BY ROLE
// ========================================================

export async function getAdminUsersByRole(
  token: string,
  role: string
): Promise<User[]> {

  const response =
    await fetch(
      `${API_BASE_URL}/admin/users/role/${encodeURIComponent(role)}`,
      {
        method: 'GET',

        headers: {
          Authorization:
            `Bearer ${token}`,

          'Content-Type':
            'application/json',
        },
      }
    );

  const responseText =
    await response.text();

  if (!response.ok) {

    throw new Error(
      responseText ||
      'Failed to load users by role'
    );
  }

  return JSON.parse(responseText);
}


// ========================================================
// GET SINGLE ADMIN USER
// ========================================================

export async function getAdminUser(
  token: string,
  userId: number
): Promise<User> {

  const response =
    await fetch(
      `${API_BASE_URL}/admin/users/${userId}`,
      {
        method: 'GET',

        headers: {
          Authorization:
            `Bearer ${token}`,

          'Content-Type':
            'application/json',
        },
      }
    );

  const responseText =
    await response.text();

  if (!response.ok) {

    throw new Error(
      responseText ||
      'Failed to load user'
    );
  }

  return JSON.parse(responseText);
}


// ========================================================
// CREATE ADMIN USER
// ========================================================

export async function createAdminUser(
  token: string,
  data: {
    fullName: string;
    email: string;
    mobileNumber: string;
    password: string;
    role: string;
  }
): Promise<User> {

  const response =
    await fetch(
      `${API_BASE_URL}/admin/users`,
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${token}`,

          'Content-Type':
            'application/json',
        },

        body: JSON.stringify(data),
      }
    );

  const responseText =
    await response.text();

  if (!response.ok) {

    throw new Error(
      responseText ||
      'Failed to create user'
    );
  }

  return JSON.parse(responseText);
}


// ========================================================
// UPDATE ADMIN USER
// ========================================================

export async function updateAdminUser(
  token: string,
  userId: number,
  data: {
    fullName?: string;
    email?: string;
    mobileNumber?: string;
  }
): Promise<User> {

  const response =
    await fetch(
      `${API_BASE_URL}/admin/users/${userId}`,
      {
        method: 'PUT',

        headers: {
          Authorization:
            `Bearer ${token}`,

          'Content-Type':
            'application/json',
        },

        body: JSON.stringify(data),
      }
    );

  const responseText =
    await response.text();

  if (!response.ok) {

    throw new Error(
      responseText ||
      'Failed to update user'
    );
  }

  return JSON.parse(responseText);
}


// ========================================================
// CHANGE ADMIN USER ROLE
// ========================================================

export async function changeAdminUserRole(
  token: string,
  userId: number,
  role: string
): Promise<User> {

  const url =
    `${API_BASE_URL}/admin/users/${userId}/role?role=${encodeURIComponent(role)}`;

  console.log(
    'CHANGE USER ROLE URL:',
    url
  );

  const response =
    await fetch(
      url,
      {
        method: 'PUT',

        headers: {
          Authorization:
            `Bearer ${token}`,

          'Content-Type':
            'application/json',
        },
      }
    );

  const responseText =
    await response.text();

  console.log(
    'CHANGE USER ROLE STATUS:',
    response.status
  );

  console.log(
    'CHANGE USER ROLE RESPONSE:',
    responseText
  );

  if (!response.ok) {

    throw new Error(
      responseText ||
      'Failed to change user role'
    );
  }

  return JSON.parse(responseText);
}


// ========================================================
// CHANGE ADMIN USER PASSWORD
// ========================================================

export async function changeAdminUserPassword(
  token: string,
  userId: number,
  password: string
): Promise<string> {

  const response =
    await fetch(
      `${API_BASE_URL}/admin/users/${userId}/password`,
      {
        method: 'PUT',

        headers: {
          Authorization:
            `Bearer ${token}`,

          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
          password,
        }),
      }
    );

  const responseText =
    await response.text();

  if (!response.ok) {

    throw new Error(
      responseText ||
      'Failed to change password'
    );
  }

  return responseText;
}


// ========================================================
// ENABLE / DISABLE ADMIN USER
// ========================================================

export async function changeAdminUserStatus(
  token: string,
  userId: number,
  enabled: boolean
): Promise<User> {

  const response =
    await fetch(
      `${API_BASE_URL}/admin/users/${userId}/status?enabled=${enabled}`,
      {
        method: 'PUT',

        headers: {
          Authorization:
            `Bearer ${token}`,

          'Content-Type':
            'application/json',
        },
      }
    );

  const responseText =
    await response.text();

  if (!response.ok) {

    throw new Error(
      responseText ||
      'Failed to change user status'
    );
  }

  return JSON.parse(responseText);
}


// ========================================================
// DELETE ADMIN USER
// ========================================================

export async function deleteAdminUser(
  token: string,
  userId: number
): Promise<void> {

  const response =
    await fetch(
      `${API_BASE_URL}/admin/users/${userId}`,
      {
        method: 'DELETE',

        headers: {
          Authorization:
            `Bearer ${token}`,

          'Content-Type':
            'application/json',
        },
      }
    );

  const responseText =
    await response.text();

  if (!response.ok) {

    throw new Error(
      responseText ||
      'Failed to delete user'
    );
  }
}


// ========================================================
// GET USER CONTRIBUTIONS
// ========================================================

export async function getUserContributions(
  token: string,
  userId: number
): Promise<Contribution[]> {

  const response =
    await fetch(
      `${API_BASE_URL}/contributions/user/${userId}`,
      {
        method: 'GET',

        headers: {
          Authorization:
            `Bearer ${token}`,

          'Content-Type':
            'application/json',
        },
      }
    );

  const responseText =
    await response.text();

  if (!response.ok) {

    throw new Error(
      responseText ||
      'Failed to load user contributions'
    );
  }

  return JSON.parse(responseText);
}


// ========================================================
// UPLOAD PHOTO
// ========================================================

export async function uploadPhoto(
  token: string,
  photoUri: string
): Promise<string> {

  console.log('--------------------------------');
  console.log('UPLOAD PHOTO START');

  console.log(
    'UPLOAD PHOTO ORIGINAL URI:',
    photoUri
  );

  console.log(
    'UPLOAD PHOTO TOKEN EXISTS:',
    !!token
  );

  let uploadUri = photoUri;

  let uploadFileName =
    'photo.jpg';

  let uploadMimeType =
    'image/jpeg';


  // ======================================================
  // NATIVE IMAGE COMPRESSION
  // ======================================================

  if (Platform.OS !== 'web') {

    console.log(
      'UPLOAD PHOTO PLATFORM:',
      Platform.OS
    );

    console.log(
      'UPLOAD PHOTO MODE: NATIVE'
    );

    console.log(
      'UPLOAD PHOTO: COMPRESSING IMAGE...'
    );

    try {

      const compressed =
        await ImageManipulator.manipulateAsync(
          photoUri,

          [
            {
              resize: {
                width: 1600,
              },
            },
          ],

          {
            compress: 0.7,

            format:
              ImageManipulator.SaveFormat.JPEG,
          }
        );

      uploadUri =
        compressed.uri;

      uploadFileName =
        `team-bsy-${Date.now()}.jpg`;

      uploadMimeType =
        'image/jpeg';

      console.log(
        'UPLOAD PHOTO COMPRESSION SUCCESS'
      );

      console.log(
        'UPLOAD PHOTO COMPRESSED URI:',
        uploadUri
      );

      console.log(
        'UPLOAD PHOTO COMPRESSED FILE NAME:',
        uploadFileName
      );

      console.log(
        'UPLOAD PHOTO COMPRESSED MIME TYPE:',
        uploadMimeType
      );

    } catch (compressionError) {

      console.error(
        'UPLOAD PHOTO COMPRESSION ERROR:',
        compressionError
      );

      console.log(
        'UPLOAD PHOTO: USING ORIGINAL PHOTO'
      );

      uploadUri =
        photoUri;

      const originalFileName =
        photoUri
          .split('/')
          .pop()
          ?.split('?')[0] ||
        'photo.jpg';

      uploadFileName =
        originalFileName;

      const extension =
        originalFileName
          .split('.')
          .pop()
          ?.toLowerCase() ||
        'jpg';

      uploadMimeType =
        extension === 'png'
          ? 'image/png'
          : extension === 'webp'
            ? 'image/webp'
            : 'image/jpeg';
    }

  } else {

    // ====================================================
    // WEB
    // ====================================================

    console.log(
      'UPLOAD PHOTO PLATFORM: web'
    );

    console.log(
      'UPLOAD PHOTO MODE: WEB'
    );

    console.log(
      'UPLOAD PHOTO: USING ORIGINAL IMAGE'
    );

    const originalFileName =
      photoUri
        .split('/')
        .pop()
        ?.split('?')[0] ||
      'photo.jpg';

    uploadFileName =
      originalFileName;

    const extension =
      originalFileName
        .split('.')
        .pop()
        ?.toLowerCase() ||
      'jpg';

    uploadMimeType =
      extension === 'png'
        ? 'image/png'
        : extension === 'webp'
          ? 'image/webp'
          : 'image/jpeg';
  }


  console.log(
    'UPLOAD PHOTO FINAL URI:',
    uploadUri
  );

  console.log(
    'UPLOAD PHOTO FINAL FILE NAME:',
    uploadFileName
  );

  console.log(
    'UPLOAD PHOTO FINAL MIME TYPE:',
    uploadMimeType
  );


  // ======================================================
  // CREATE FORM DATA
  // ======================================================

  const formData =
    new FormData();


  // ======================================================
  // WEB FILE
  // ======================================================

  if (Platform.OS === 'web') {

    console.log(
      'UPLOAD PHOTO: READING WEB FILE'
    );

    const photoResponse =
      await fetch(uploadUri);

    if (!photoResponse.ok) {

      throw new Error(
        'Unable to read selected photo'
      );
    }

    const blob =
      await photoResponse.blob();

    formData.append(
      'file',
      blob,
      uploadFileName
    );

  } else {

    // ====================================================
    // ANDROID / IOS FILE
    // ====================================================

    console.log(
      'UPLOAD PHOTO: ADDING NATIVE FILE'
    );

    formData.append(
      'file',
      {
        uri: uploadUri,
        name: uploadFileName,
        type: uploadMimeType,
      } as any
    );
  }


  // ======================================================
  // UPLOAD REQUEST
  // ======================================================

  const uploadUrl =
    `${API_BASE_URL}/upload/photo`;

  console.log(
    'UPLOAD PHOTO URL:',
    uploadUrl
  );

  console.log(
    'UPLOAD PHOTO SENDING REQUEST...'
  );

  try {

    const response =
      await fetch(
        uploadUrl,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body: formData,
        }
      );

    console.log(
      'UPLOAD PHOTO RESPONSE STATUS:',
      response.status
    );

    const responseText =
      await response.text();

    console.log(
      'UPLOAD PHOTO RESPONSE:',
      responseText
    );

    if (!response.ok) {

      console.log(
        'UPLOAD PHOTO HTTP ERROR STATUS:',
        response.status
      );

      console.log(
        'UPLOAD PHOTO HTTP ERROR BODY:',
        responseText
      );

      throw new Error(
        `Photo upload failed: HTTP ${response.status} - ${responseText}`
      );
    }

    let data: any;

    try {

      data =
        JSON.parse(responseText);

    } catch {

      throw new Error(
        'Invalid response received from photo upload server'
      );
    }

    if (!data.imageUrl) {

      throw new Error(
        'Photo uploaded but image URL was not returned'
      );
    }

    const imageUrl =
      `${API_BASE_URL.replace(
        '/api',
        ''
      )}${data.imageUrl}`;

    console.log(
      'UPLOAD PHOTO SUCCESS:',
      imageUrl
    );

    console.log(
      '--------------------------------'
    );

    return imageUrl;

  } catch (error) {

    console.error(
      'UPLOAD PHOTO FETCH ERROR:',
      error
    );

    console.log(
      '--------------------------------'
    );

    throw error;
  }
}


// ========================================================
// CREATE CONTRIBUTION
// ========================================================

export async function createContribution(
  token: string,
  contribution: {
    contributorId?: number;
    mentorId?: number | null;
    contributorName: string;
    mobileNumber?: string;
    amount: number;
    paymentMethod: string;
    transactionId?: string | null;
    photoUrl?: string | null;
    notes?: string;
  }
): Promise<Contribution> {

  console.log('--------------------------------');

  console.log(
    'CREATE CONTRIBUTION START'
  );

  console.log(
    'CONTRIBUTION DATA:',
    JSON.stringify(contribution)
  );

  const url =
    `${API_BASE_URL}/contributions`;

  console.log(
    'CONTRIBUTION URL:',
    url
  );

  try {

    const response =
      await fetch(
        url,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${token}`,

            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify(
              contribution
            ),
        }
      );

    console.log(
      'CONTRIBUTION RESPONSE STATUS:',
      response.status
    );

    const responseText =
      await response.text();

    console.log(
      'CONTRIBUTION RESPONSE:',
      responseText
    );

    if (!response.ok) {

      throw new Error(
        responseText ||
        'Failed to create contribution'
      );
    }

    const data =
      JSON.parse(responseText);

    console.log(
      'CONTRIBUTION SUCCESS:',
      JSON.stringify(data)
    );

    console.log(
      '--------------------------------'
    );

    return data;

  } catch (error) {

    console.error(
      'CONTRIBUTION CREATE ERROR:',
      error
    );

    console.log(
      '--------------------------------'
    );

    throw error;
  }
}


// ========================================================
// RAZORPAY CREATE ORDER
// ========================================================

export async function createRazorpayOrder(
  token: string,
  data: {
    amount: number;
    contributorId?: number;
    contributorName: string;
    mobileNumber: string;
    notes?: string;
  }
): Promise<RazorpayOrderResponse> {

  console.log('--------------------------------');
  console.log('RAZORPAY CREATE ORDER START');

  const url =
    `${API_BASE_URL}/payments/create-order`;

  console.log(
    'RAZORPAY CREATE ORDER URL:',
    url
  );

  console.log(
    'RAZORPAY ORDER DATA:',
    JSON.stringify(data)
  );

  try {

    const response =
      await fetch(
        url,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${token}`,

            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify(data),
        }
      );

    const responseText =
      await response.text();

    console.log(
      'RAZORPAY CREATE ORDER STATUS:',
      response.status
    );

    console.log(
      'RAZORPAY CREATE ORDER RESPONSE:',
      responseText
    );

    if (!response.ok) {

      throw new Error(
        responseText ||
        'Failed to create Razorpay order'
      );
    }

    const result =
      JSON.parse(responseText);

    console.log(
      'RAZORPAY ORDER CREATED:',
      JSON.stringify(result)
    );

    console.log(
      '--------------------------------'
    );

    return result;

  } catch (error) {

    console.error(
      'RAZORPAY CREATE ORDER ERROR:',
      error
    );

    console.log(
      '--------------------------------'
    );

    throw error;
  }
}


// ========================================================
// RAZORPAY VERIFY PAYMENT
// ========================================================

export async function verifyRazorpayPayment(
  token: string,
  data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;

    contributorId?: number;
    contributorName: string;
    mobileNumber: string;

    amount: number;

    notes?: string;

    photoUrl?: string | null;
  }
): Promise<RazorpayVerificationResponse> {

  console.log('--------------------------------');

  console.log(
    'RAZORPAY VERIFY PAYMENT START'
  );

  const url =
    `${API_BASE_URL}/payments/verify`;

  console.log(
    'RAZORPAY VERIFY URL:',
    url
  );

  console.log(
    'RAZORPAY ORDER ID:',
    data.razorpayOrderId
  );

  console.log(
    'RAZORPAY PAYMENT ID:',
    data.razorpayPaymentId
  );

  console.log(
    'RAZORPAY AMOUNT:',
    data.amount
  );

  /*
   * Do NOT log the Razorpay signature.
   */

  try {

    const response =
      await fetch(
        url,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${token}`,

            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify(data),
        }
      );

    const responseText =
      await response.text();

    console.log(
      'RAZORPAY VERIFY STATUS:',
      response.status
    );

    console.log(
      'RAZORPAY VERIFY RESPONSE:',
      responseText
    );

    if (!response.ok) {

      throw new Error(
        responseText ||
        'Razorpay payment verification failed'
      );
    }

    const result =
      JSON.parse(responseText);

    console.log(
      'RAZORPAY PAYMENT VERIFIED:',
      JSON.stringify(result)
    );

    console.log(
      '--------------------------------'
    );

    return result;

  } catch (error) {

    console.error(
      'RAZORPAY VERIFY PAYMENT ERROR:',
      error
    );

    console.log(
      '--------------------------------'
    );

    throw error;
  }
}


// ========================================================
// GET ADMIN CONTRIBUTIONS
// ========================================================

export async function getAdminContributions(
  token: string
): Promise<Contribution[]> {

  console.log(
    'GET ADMIN CONTRIBUTIONS'
  );

  const response =
    await fetch(
      `${API_BASE_URL}/admin/contributions`,
      {
        method: 'GET',

        headers: {
          Authorization:
            `Bearer ${token}`,

          'Content-Type':
            'application/json',
        },
      }
    );

  const responseText =
    await response.text();

  console.log(
    'ADMIN CONTRIBUTIONS STATUS:',
    response.status
  );

  console.log(
    'ADMIN CONTRIBUTIONS RESPONSE:',
    responseText
  );

  if (!response.ok) {

    throw new Error(
      responseText ||
      'Failed to load admin contributions'
    );
  }

  return JSON.parse(responseText);
}


// ========================================================
// VERIFY ADMIN CONTRIBUTION
// ========================================================

export async function verifyAdminContribution(
  token: string,
  contributionId: number,
  adminId: number
): Promise<Contribution> {

  const url =
    `${API_BASE_URL}/admin/contributions/${contributionId}/verify?adminId=${adminId}`;

  console.log(
    'VERIFY CONTRIBUTION URL:',
    url
  );

  const response =
    await fetch(
      url,
      {
        method: 'PUT',

        headers: {
          Authorization:
            `Bearer ${token}`,

          'Content-Type':
            'application/json',
        },
      }
    );

  const responseText =
    await response.text();

  console.log(
    'VERIFY CONTRIBUTION STATUS:',
    response.status
  );

  console.log(
    'VERIFY CONTRIBUTION RESPONSE:',
    responseText
  );

  if (!response.ok) {

    throw new Error(
      responseText ||
      'Failed to verify contribution'
    );
  }

  return JSON.parse(responseText);
}


// ========================================================
// REJECT ADMIN CONTRIBUTION
// ========================================================

export async function rejectAdminContribution(
  token: string,
  contributionId: number,
  adminId: number
): Promise<Contribution> {

  const url =
    `${API_BASE_URL}/admin/contributions/${contributionId}/reject?adminId=${adminId}`;

  console.log(
    'REJECT CONTRIBUTION URL:',
    url
  );

  const response =
    await fetch(
      url,
      {
        method: 'PUT',

        headers: {
          Authorization:
            `Bearer ${token}`,

          'Content-Type':
            'application/json',
        },
      }
    );

  const responseText =
    await response.text();

  console.log(
    'REJECT CONTRIBUTION STATUS:',
    response.status
  );

  console.log(
    'REJECT CONTRIBUTION RESPONSE:',
    responseText
  );

  if (!response.ok) {

    throw new Error(
      responseText ||
      'Failed to reject contribution'
    );
  }

  return JSON.parse(responseText);
}


// ========================================================
// EDIT OFFLINE ADMIN CONTRIBUTION
// ========================================================

export async function editAdminContribution(
  token: string,
  contributionId: number,
  adminId: number,
  data: {
    contributorName: string;
    mobileNumber?: string;
    amount: number;
    transactionId?: string | null;
    notes?: string;
    paymentStatus: string;
  }
): Promise<Contribution> {

  const url =
    `${API_BASE_URL}/contributions/${contributionId}/edit?adminId=${adminId}`;

  console.log(
    'EDIT CONTRIBUTION URL:',
    url
  );

  console.log(
    'EDIT CONTRIBUTION DATA:',
    JSON.stringify(data)
  );

  const response =
    await fetch(
      url,
      {
        method: 'PUT',

        headers: {
          Authorization:
            `Bearer ${token}`,

          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify(data),
      }
    );

  const responseText =
    await response.text();

  console.log(
    'EDIT CONTRIBUTION STATUS:',
    response.status
  );

  console.log(
    'EDIT CONTRIBUTION RESPONSE:',
    responseText
  );

  if (!response.ok) {

    throw new Error(
      responseText ||
      'Failed to edit contribution'
    );
  }

  return JSON.parse(responseText);
}
