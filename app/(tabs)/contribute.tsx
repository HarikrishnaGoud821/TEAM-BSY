import { useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import RazorpayCheckout from 'react-native-razorpay';

import {
  createRazorpayOrder,
  uploadPhoto,
  verifyRazorpayPayment,
} from '@/src/services/api';

import { getToken, getUser } from '@/src/services/session';

const AMOUNTS = [100, 500, 1000, 2500];

export default function ContributeScreen() {

  const cameraRef =
    useRef<CameraView>(null);

  const [
    cameraPermission,
    requestCameraPermission,
  ] = useCameraPermissions();

  const [cameraOpen, setCameraOpen] =
    useState(false);

  const [selectedAmount, setSelectedAmount] =
    useState<number>(500);

  const [customAmount, setCustomAmount] =
    useState('');

  const [purpose] =
    useState('General fund');

  const [paymentMethod, setPaymentMethod] =
    useState<'QR' | 'DIRECT'>('DIRECT');

  const [fullName, setFullName] =
    useState('');

  const [mobileNumber, setMobileNumber] =
    useState('');

  const [photoUri, setPhotoUri] =
    useState<string | null>(null);

  const [submitted, setSubmitted] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [savedAmount, setSavedAmount] =
    useState(0);

  const [error, setError] =
    useState('');

  /*
  ========================================================
  GET CONTRIBUTION AMOUNT
  ========================================================
  */

  const getAmount = (): number => {

    if (customAmount.trim()) {

      const parsed =
        Number(customAmount);

      if (
        !Number.isNaN(parsed) &&
        parsed > 0
      ) {
        return parsed;
      }

      return 0;
    }

    return selectedAmount;
  };


  /*
  ========================================================
  OPEN CAMERA
  ========================================================
  */

  const takePhoto = async () => {

    try {

      if (!cameraPermission?.granted) {

        const permission =
          await requestCameraPermission();

        if (!permission.granted) {

          Alert.alert(
            'Permission required',
            'Please allow camera access to take a photo.'
          );

          return;
        }
      }

      setCameraOpen(true);

    } catch (cameraError) {

      console.error(
        'Camera permission error:',
        cameraError
      );

      Alert.alert(
        'Unable to open camera',
        'Something went wrong while opening the camera.'
      );
    }
  };


  /*
  ========================================================
  CAPTURE PHOTO
  ========================================================
  */

  const capturePhoto = async () => {

    try {

      if (!cameraRef.current) {
        return;
      }

      const photo =
        await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });

      if (photo?.uri) {

        setPhotoUri(photo.uri);
        setError('');
        setCameraOpen(false);
      }

    } catch (cameraError) {

      console.error(
        'Photo capture error:',
        cameraError
      );

      Alert.alert(
        'Unable to take photo',
        'Something went wrong while taking the photo.'
      );
    }
  };


  /*
  ========================================================
  PICK PHOTO FROM GALLERY
  ========================================================
  */

  const pickPhoto = async () => {

    try {

      const permission =
        await ImagePicker
          .requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {

        Alert.alert(
          'Permission required',
          'Please allow photo library access to select a photo.'
        );

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({

          mediaTypes: ['images'],

          allowsEditing: true,

          aspect: [4, 3],

          quality: 0.8,
        });

      if (
        !result.canceled &&
        result.assets &&
        result.assets.length > 0
      ) {

        setPhotoUri(
          result.assets[0].uri
        );

        setError('');
      }

    } catch (photoError) {

      console.error(
        'Photo selection error:',
        photoError
      );

      Alert.alert(
        'Unable to select photo',
        'Something went wrong while selecting the photo.'
      );
    }
  };


  /*
  ========================================================
  REMOVE PHOTO
  ========================================================
  */

  const removePhoto = () => {
    setPhotoUri(null);
  };


  /*
  ========================================================
  HANDLE RAZORPAY PAYMENT
  ========================================================
  */

  const handleRazorpayPayment = async (
    token: string,
    user: any,
    amount: number,
    uploadedPhotoUrl: string | null
  ) => {

    console.log('--------------------------------');
    console.log(
      'RAZORPAY PAYMENT FLOW START'
    );

    /*
    ======================================================
    STEP 1
    CREATE RAZORPAY ORDER
    ======================================================
    */

    console.log(
      'STEP 1: Creating Razorpay order...'
    );

    const order =
      await createRazorpayOrder(
        token,
        {
          amount,

          contributorId:
            user.id,

          contributorName:
            fullName.trim(),

          mobileNumber:
            mobileNumber.trim(),

          notes:
            purpose,
        }
      );

    console.log(
      'RAZORPAY ORDER CREATED:',
      order.orderId
    );

    console.log(
      'RAZORPAY ORDER AMOUNT:',
      order.amount
    );

    /*
    ======================================================
    STEP 2
    OPEN RAZORPAY CHECKOUT
    ======================================================
    */

    console.log(
      'STEP 2: Opening Razorpay Checkout...'
    );

    const options = {

      key:
        order.keyId,

      amount:
        order.amount,

      currency:
        order.currency,

      name:
        'TEAM BSY',

      description:
        'TEAM BSY Contribution',

      order_id:
        order.orderId,

      prefill: {
        name:
          fullName.trim(),

        contact:
          mobileNumber.trim(),
      },

      theme: {
        color:
          '#2F7467',
      },
    };

    console.log(
      'RAZORPAY CHECKOUT OPEN'
    );

    const paymentData =
      await RazorpayCheckout.open(
        options
      );

    console.log(
      'RAZORPAY CHECKOUT SUCCESS'
    );

    console.log(
      'RAZORPAY ORDER ID:',
      paymentData.razorpay_order_id
    );

    console.log(
      'RAZORPAY PAYMENT ID:',
      paymentData.razorpay_payment_id
    );

    /*
     * DO NOT LOG THE SIGNATURE.
     */

    /*
    ======================================================
    STEP 3
    VERIFY PAYMENT WITH SPRING BOOT
    ======================================================
    */

    console.log(
      'STEP 3: Verifying Razorpay payment...'
    );

    const verification =
      await verifyRazorpayPayment(
        token,
        {
          razorpayOrderId:
            paymentData.razorpay_order_id,

          razorpayPaymentId:
            paymentData.razorpay_payment_id,

          razorpaySignature:
            paymentData.razorpay_signature,

          contributorId:
            user.id,

          contributorName:
            fullName.trim(),

          mobileNumber:
            mobileNumber.trim(),

          amount,

          photoUrl:
            uploadedPhotoUrl,

          notes:
            purpose,
        }
      );

    console.log(
      'RAZORPAY VERIFICATION SUCCESS'
    );

    console.log(
      'CONTRIBUTION ID:',
      verification.contribution?.id
    );

    console.log(
      'PAYMENT STATUS:',
      verification.status
    );

    /*
    ======================================================
    STEP 4
    SHOW SUCCESS SCREEN
    ======================================================
    */

    setSavedAmount(
      Number(
        verification.amount
      ) || amount
    );

    setSubmitted(true);

    console.log('--------------------------------');
  };


  /*
  ========================================================
  SUBMIT CONTRIBUTION
  ========================================================
  */

  const handleContinue = async () => {

    setError('');

    const amount =
      getAmount();

    /*
    ======================================================
    VALIDATE AMOUNT
    ======================================================
    */

    if (amount <= 0) {

      setError(
        'Please enter a valid contribution amount.'
      );

      return;
    }

    /*
    ======================================================
    VALIDATE NAME
    ======================================================
    */

    if (!fullName.trim()) {

      setError(
        'Please enter your full name.'
      );

      return;
    }

    /*
    ======================================================
    VALIDATE MOBILE
    ======================================================
    */

    if (!mobileNumber.trim()) {

      setError(
        'Please enter your mobile number.'
      );

      return;
    }

    if (
      mobileNumber.trim().length < 10
    ) {

      setError(
        'Please enter a valid mobile number.'
      );

      return;
    }


    /*
    ======================================================
    QR CURRENTLY NOT IMPLEMENTED
    ======================================================
    */

    if (paymentMethod === 'QR') {

      Alert.alert(
        'QR payment coming soon',
        'QR collection will be implemented for Admin and Mentor collection.'
      );

      return;
    }


    try {

      setLoading(true);

      console.log('--------------------------------');
      console.log(
        'TEAM BSY CONTRIBUTION START'
      );

      console.log(
        'AMOUNT:',
        amount
      );

      console.log(
        'NAME:',
        fullName.trim()
      );

      console.log(
        'MOBILE:',
        mobileNumber.trim()
      );


      /*
      ======================================================
      GET SESSION
      ======================================================
      */

      const token =
        await getToken();

      const user =
        await getUser();

      if (!token || !user) {

        setError(
          'Your session has expired. Please login again.'
        );

        return;
      }


      /*
      ======================================================
      PHOTO
      ======================================================

      Upload the photo before opening Razorpay.

      The backend URL is then included in the payment
      verification request.

      ======================================================
      */

      let uploadedPhotoUrl:
        string | null = null;

      if (photoUri) {

        console.log(
          'PHOTO SELECTED'
        );

        console.log(
          'Uploading photo before payment...'
        );

        uploadedPhotoUrl =
          await uploadPhoto(
            token,
            photoUri
          );

        console.log(
          'PHOTO UPLOAD SUCCESS:',
          uploadedPhotoUrl
        );
      }


      /*
      ======================================================
      RAZORPAY DIRECT PAYMENT
      ======================================================
      */

      await handleRazorpayPayment(
        token,
        user,
        amount,
        uploadedPhotoUrl
      );

    } catch (submitError: any) {

      console.error(
        'Contribution submission error:',
        submitError
      );


      /*
      ======================================================
      PAYMENT CANCELLED
      ======================================================
      */

      if (
        submitError?.code ===
        '2'
      ) {

        console.log(
          'RAZORPAY PAYMENT CANCELLED'
        );

        setError(
          'Payment was cancelled.'
        );

        return;
      }


      /*
      ======================================================
      OTHER ERROR
      ======================================================
      */

      setError(

        submitError instanceof Error

          ? submitError.message

          : 'Payment failed. Please try again.'
      );

    } finally {

      setLoading(false);

      console.log(
        'TEAM BSY CONTRIBUTION FLOW FINISHED'
      );

      console.log('--------------------------------');
    }
  };


  /*
  ========================================================
  SUCCESS SCREEN
  ========================================================
  */

  if (submitted) {

    return (

      <View style={styles.successContainer}>

        <View style={styles.successIcon}>

          <Text style={styles.successIconText}>
            ✓
          </Text>

        </View>


        <Text style={styles.successLabel}>
          PAYMENT SUCCESSFUL
        </Text>


        <Text style={styles.successTitle}>
          Thank you for giving.
        </Text>


        <Text style={styles.successAmount}>
          ₹{savedAmount.toLocaleString('en-IN')}
        </Text>


        <Text style={styles.successDescription}>
          Your Razorpay payment has been
          successfully verified and your
          contribution has been recorded
          securely.
        </Text>


        <View style={styles.receiptCard}>

          <Text style={styles.receiptLabel}>
            CONTRIBUTION
          </Text>

          <Text style={styles.receiptValue}>
            Successfully recorded in TEAM BSY
          </Text>


          <View style={styles.receiptDivider} />


          <Text style={styles.successPaymentText}>
            ✓ PAYMENT VERIFIED
          </Text>

        </View>


        <Pressable
          style={styles.backButton}
          onPress={() => {

            setSubmitted(false);

            setPhotoUri(null);

            setCustomAmount('');

            setSelectedAmount(500);

            setError('');
          }}
        >

          <Text style={styles.backButtonText}>
            Make another contribution
          </Text>

        </Pressable>

      </View>
    );
  }


  /*
  ========================================================
  MAIN SCREEN
  ========================================================
  */

  return (

    <>

      {/* CAMERA MODAL */}

      <Modal
        visible={cameraOpen}
        animationType="slide"
        onRequestClose={() =>
          setCameraOpen(false)
        }
      >

        <View style={styles.cameraContainer}>

          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
          />


          <View style={styles.cameraControls}>

            <Pressable
              style={styles.cameraCancelButton}
              onPress={() =>
                setCameraOpen(false)
              }
            >

              <Text style={styles.cameraCancelText}>
                Cancel
              </Text>

            </Pressable>


            <Pressable
              style={styles.captureButton}
              onPress={capturePhoto}
            >

              <View
                style={styles.captureButtonInner}
              />

            </Pressable>


            <View style={styles.cameraSpacer} />

          </View>

        </View>

      </Modal>


      {/* CONTRIBUTION PAGE */}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* HEADER */}

        <Text style={styles.heading}>
          TEAM BSY · CONTRIBUTIONS
        </Text>


        <Text style={styles.subHeading}>
          Give with purpose.
        </Text>


        <Text style={styles.description}>
          Your support keeps community initiatives moving.
        </Text>


        {/* AMOUNT */}

        <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            CHOOSE AN AMOUNT
          </Text>


          <View style={styles.amountGrid}>

            {AMOUNTS.map((amount) => {

              const active =
                selectedAmount === amount &&
                !customAmount;

              return (

                <Pressable
                  key={amount}
                  onPress={() => {

                    setSelectedAmount(
                      amount
                    );

                    setCustomAmount('');

                    setError('');
                  }}

                  style={[
                    styles.amountButton,

                    active &&
                      styles.amountButtonActive,
                  ]}
                >

                  <Text
                    style={[
                      styles.amountButtonText,

                      active &&
                        styles.amountButtonTextActive,
                    ]}
                  >

                    ₹
                    {amount.toLocaleString(
                      'en-IN'
                    )}

                  </Text>

                </Pressable>
              );
            })}

          </View>


          <TextInput
            value={customAmount}

            onChangeText={(value) => {

              setCustomAmount(value);

              setSelectedAmount(0);

              setError('');
            }}

            placeholder="Enter custom amount"

            placeholderTextColor="#9AA8A3"

            keyboardType="numeric"

            style={styles.customAmountInput}
          />

        </View>


        {/* PAYMENT METHOD */}

        <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            PAYMENT METHOD
          </Text>


          <View style={styles.paymentToggle}>

            {/* DIRECT */}

            <Pressable
              onPress={() => {

                setPaymentMethod(
                  'DIRECT'
                );

                setError('');
              }}

              style={[
                styles.paymentOption,

                paymentMethod === 'DIRECT' &&
                  styles.paymentOptionActive,
              ]}
            >

              <Text
                style={[
                  styles.paymentOptionIcon,

                  paymentMethod === 'DIRECT' &&
                    styles.paymentOptionIconActive,
                ]}
              >
                ₹
              </Text>


              <Text
                style={[
                  styles.paymentOptionText,

                  paymentMethod === 'DIRECT' &&
                    styles.paymentOptionTextActive,
                ]}
              >
                Direct payment
              </Text>

            </Pressable>


            {/* QR */}

            <Pressable
              onPress={() => {

                setPaymentMethod('QR');

                setError('');
              }}

              style={[
                styles.paymentOption,

                paymentMethod === 'QR' &&
                  styles.paymentOptionActive,
              ]}
            >

              <Text
                style={[
                  styles.paymentOptionIcon,

                  paymentMethod === 'QR' &&
                    styles.paymentOptionIconActive,
                ]}
              >
                ▦
              </Text>


              <Text
                style={[
                  styles.paymentOptionText,

                  paymentMethod === 'QR' &&
                    styles.paymentOptionTextActive,
                ]}
              >
                Scan QR
              </Text>

            </Pressable>

          </View>


          {/* PAYMENT INFORMATION */}

          {paymentMethod === 'DIRECT' ? (

            <View style={styles.paymentInfoBox}>

              <Text style={styles.paymentInfoTitle}>
                Secure online payment
              </Text>

              <Text style={styles.paymentInfoText}>
                You will be redirected to Razorpay
                Checkout to complete your contribution
                using UPI, cards, net banking and
                supported payment methods.
              </Text>

            </View>

          ) : (

            <View style={styles.paymentInfoBox}>

              <Text style={styles.paymentInfoTitle}>
                QR payment
              </Text>

              <Text style={styles.paymentInfoText}>
                QR collection will be available for
                Admin and Mentor collection.
              </Text>

            </View>

          )}

        </View>


        {/* PAYMENT DETAILS */}

        <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            PAYMENT DETAILS
          </Text>


          <View style={styles.infoRow}>

            <Text style={styles.infoIcon}>
              ●
            </Text>

            <Text style={styles.infoText}>
              {purpose}
            </Text>

          </View>


          {/* FULL NAME */}

          <TextInput
            value={fullName}

            onChangeText={(value) => {

              setFullName(value);

              setError('');
            }}

            placeholder="Full name"

            placeholderTextColor="#9AA8A3"

            style={styles.input}

            autoCapitalize="words"
          />


          {/* MOBILE */}

          <TextInput
            value={mobileNumber}

            onChangeText={(value) => {

              setMobileNumber(value);

              setError('');
            }}

            placeholder="Mobile number"

            placeholderTextColor="#9AA8A3"

            keyboardType="phone-pad"

            style={styles.input}

            maxLength={10}
          />


          {/* PHOTO */}

          <View style={styles.photoSection}>

            <View style={styles.photoHeader}>

              <Text style={styles.photoTitle}>
                ADD PHOTO
              </Text>


              <Text style={styles.photoDescription}>
                Add a photo related to your contribution.
              </Text>

            </View>


            {photoUri ? (

              <View
                style={
                  styles.photoPreviewContainer
                }
              >

                <Image
                  source={{
                    uri: photoUri,
                  }}

                  style={
                    styles.photoPreview
                  }

                  resizeMode="cover"
                />


                <View style={styles.photoActions}>

                  <Pressable
                    style={
                      styles.changePhotoButton
                    }

                    onPress={pickPhoto}
                  >

                    <Text
                      style={
                        styles.changePhotoText
                      }
                    >
                      Change photo
                    </Text>

                  </Pressable>


                  <Pressable
                    style={
                      styles.removePhotoButton
                    }

                    onPress={removePhoto}
                  >

                    <Text
                      style={
                        styles.removePhotoText
                      }
                    >
                      Remove
                    </Text>

                  </Pressable>

                </View>

              </View>

            ) : (

              <View
                style={
                  styles.photoOptionsContainer
                }
              >

                {/* CAMERA */}

                <Pressable
                  style={
                    styles.addPhotoButton
                  }

                  onPress={takePhoto}
                >

                  <View
                    style={
                      styles.galleryIconCircle
                    }
                  >

                    <Text
                      style={
                        styles.galleryIcon
                      }
                    >
                      📷
                    </Text>

                  </View>


                  <View
                    style={
                      styles.addPhotoTextContainer
                    }
                  >

                    <Text
                      style={
                        styles.addPhotoTitle
                      }
                    >
                      Take a photo
                    </Text>


                    <Text
                      style={
                        styles.addPhotoSubtitle
                      }
                    >
                      Use your device camera
                    </Text>

                  </View>


                  <Text
                    style={
                      styles.addPhotoArrow
                    }
                  >
                    ›
                  </Text>

                </Pressable>


                {/* GALLERY */}

                <Pressable
                  style={
                    styles.addPhotoButton
                  }

                  onPress={pickPhoto}
                >

                  <View
                    style={
                      styles.galleryIconCircle
                    }
                  >

                    <Text
                      style={
                        styles.galleryIcon
                      }
                    >
                      ▣
                    </Text>

                  </View>


                  <View
                    style={
                      styles.addPhotoTextContainer
                    }
                  >

                    <Text
                      style={
                        styles.addPhotoTitle
                      }
                    >
                      Choose from gallery
                    </Text>


                    <Text
                      style={
                        styles.addPhotoSubtitle
                      }
                    >
                      Select a photo from your device
                    </Text>

                  </View>


                  <Text
                    style={
                      styles.addPhotoArrow
                    }
                  >
                    ›
                  </Text>

                </Pressable>

              </View>

            )}

          </View>


          {/* SECURITY */}

          <View style={styles.securityRow}>

            <Text style={styles.securityIcon}>
              ✓
            </Text>


            <Text style={styles.securityText}>
              Secure payment powered by Razorpay
            </Text>

          </View>

        </View>


        {/* ERROR */}

        {error ? (

          <View style={styles.errorBox}>

            <Text style={styles.errorText}>
              {error}
            </Text>

          </View>

        ) : null}


        {/* CONTINUE */}

        <Pressable
          onPress={handleContinue}

          disabled={loading}

          style={[
            styles.continueButton,

            loading &&
              styles.continueButtonDisabled,
          ]}
        >

          <Text
            style={
              styles.continueButtonText
            }
          >

            {loading
              ? 'Processing payment...'
              : paymentMethod === 'DIRECT'
                ? 'Continue to payment'
                : 'QR payment'}

          </Text>


          {!loading && (

            <Text style={styles.continueArrow}>
              →
            </Text>

          )}

        </Pressable>


        {/* FOOTER */}

        <Text style={styles.footerNote}>

          Your payment is securely processed
          through Razorpay. TEAM BSY does not
          store your card or UPI credentials.

        </Text>

      </ScrollView>

    </>
  );
}


/*
========================================================
STYLES
========================================================
*/

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F7FBF9',
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 120,
  },

  heading: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#6B7C76',
    marginBottom: 12,
  },

  subHeading: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    color: '#163A33',
    marginBottom: 8,
  },

  description: {
    fontSize: 15,
    lineHeight: 23,
    color: '#71817C',
    marginBottom: 28,
  },

  section: {
    marginBottom: 28,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#6B7C76',
    marginBottom: 14,
  },

  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  amountButton: {
    minWidth: 76,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE7E2',
    alignItems: 'center',
  },

  amountButtonActive: {
    backgroundColor: '#2F7467',
    borderColor: '#2F7467',
  },

  amountButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#48615A',
  },

  amountButtonTextActive: {
    color: '#FFFFFF',
  },

  customAmountInput: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE7E2',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#163A33',
  },

  paymentToggle: {
    flexDirection: 'row',
    backgroundColor: '#EAF1EE',
    borderRadius: 14,
    padding: 4,
  },

  paymentOption: {
    flex: 1,
    minHeight: 52,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  paymentOptionActive: {
    backgroundColor: '#FFFFFF',
  },

  paymentOptionIcon: {
    fontSize: 18,
    color: '#81918B',
  },

  paymentOptionIconActive: {
    color: '#2F7467',
  },

  paymentOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71817C',
  },

  paymentOptionTextActive: {
    color: '#163A33',
  },

  paymentInfoBox: {
    marginTop: 12,
    backgroundColor: '#EAF3EF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5E8E0',
    paddingHorizontal: 15,
    paddingVertical: 13,
  },

  paymentInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#23463E',
    marginBottom: 5,
  },

  paymentInfoText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#667C74',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE7E2',
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 12,
  },

  infoIcon: {
    fontSize: 10,
    color: '#2F7467',
    marginRight: 10,
  },

  infoText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#35534B',
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE7E2',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#163A33',
    marginBottom: 12,
  },

  photoSection: {
    marginTop: 4,
    marginBottom: 18,
  },

  photoOptionsContainer: {
    gap: 10,
  },

  photoHeader: {
    marginBottom: 10,
  },

  photoTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#6B7C76',
  },

  photoDescription: {
    fontSize: 13,
    color: '#87958F',
    marginTop: 4,
  },

  addPhotoButton: {
    minHeight: 82,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE7E2',
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  galleryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EAF3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  galleryIcon: {
    fontSize: 23,
    color: '#2F7467',
  },

  addPhotoTextContainer: {
    flex: 1,
    marginLeft: 13,
  },

  addPhotoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#23463E',
    marginBottom: 4,
  },

  addPhotoSubtitle: {
    fontSize: 12,
    color: '#87958F',
  },

  addPhotoArrow: {
    fontSize: 27,
    color: '#80918B',
    marginLeft: 8,
  },

  photoPreviewContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCE7E2',
    padding: 10,
    overflow: 'hidden',
  },

  photoPreview: {
    width: '100%',
    height: 210,
    borderRadius: 10,
    backgroundColor: '#EAF1EE',
  },

  photoActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },

  changePhotoButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#EAF3EF',
    paddingVertical: 12,
    alignItems: 'center',
  },

  changePhotoText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2F7467',
  },

  removePhotoButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#F9EEEE',
    paddingVertical: 12,
    alignItems: 'center',
  },

  removePhotoText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45B5B',
  },

  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },

  camera: {
    flex: 1,
  },

  cameraControls: {
    minHeight: 120,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },

  cameraCancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  cameraCancelText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  captureButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
  },

  cameraSpacer: {
    width: 70,
  },

  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  securityIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DDEDE7',
    color: '#2F7467',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '700',
    marginRight: 8,
  },

  securityText: {
    fontSize: 13,
    color: '#7A8984',
  },

  errorBox: {
    backgroundColor: '#FCEEEE',
    borderWidth: 1,
    borderColor: '#F0CCCC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },

  errorText: {
    fontSize: 13,
    color: '#A84747',
    lineHeight: 19,
  },

  continueButton: {
    minHeight: 56,
    backgroundColor: '#2F7467',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
  },

  continueButtonDisabled: {
    opacity: 0.65,
  },

  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  continueArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    marginLeft: 10,
  },

  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    color: '#899690',
    marginTop: 14,
    paddingHorizontal: 12,
  },

  successContainer: {
    flex: 1,
    backgroundColor: '#F7FBF9',
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DDEDE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  successIconText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#2F7467',
  },

  successLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#6B7C76',
    marginBottom: 10,
  },

  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#163A33',
    textAlign: 'center',
    marginBottom: 10,
  },

  successAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2F7467',
    marginBottom: 16,
  },

  successDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: '#71817C',
    textAlign: 'center',
    maxWidth: 360,
    marginBottom: 24,
  },

  receiptCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCE7E2',
    padding: 20,
    marginBottom: 20,
  },

  receiptLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#8A9993',
    marginBottom: 6,
  },

  receiptValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#23463E',
  },

  receiptDivider: {
    height: 1,
    backgroundColor: '#E7EFEC',
    marginVertical: 16,
  },

  successPaymentText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#2F7467',
  },

  backButton: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EAF3EF',
  },

  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2F7467',
  },

});