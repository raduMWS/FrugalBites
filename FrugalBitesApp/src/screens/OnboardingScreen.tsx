import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme';

const { width } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

interface Question {
  id: string;
  question: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const questions: Question[] = [
  {
    id: 'notifications',
    question: 'Would you like to receive notifications about deals near you?',
    icon: 'notifications-outline',
    description: 'Get alerted when restaurants nearby have surplus food at great prices.',
  },
  {
    id: 'dietary',
    question: 'Do you follow any dietary restrictions?',
    icon: 'leaf-outline',
    description: "We'll personalize your feed to show vegetarian, vegan, or other options first.",
  },
  {
    id: 'location',
    question: 'Can we use your location to find nearby offers?',
    icon: 'location-outline',
    description: 'This helps us show you the best deals within walking distance.',
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});

  const currentQuestion = questions[currentStep];
  const isLastQuestion = currentStep === questions.length - 1;

  const handleAnswer = async (answer: boolean) => {
    const newAnswers = { ...answers, [currentQuestion.id]: answer };
    setAnswers(newAnswers);

    if (isLastQuestion) {
      // Save answers and mark onboarding as complete
      await AsyncStorage.setItem('onboarding_complete', 'true');
      await AsyncStorage.setItem('onboarding_answers', JSON.stringify(newAnswers));
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboarding_complete', 'true');
    onComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Progress dots */}
      <View style={styles.progressContainer}>
        {questions.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentStep && styles.progressDotActive,
              index < currentStep && styles.progressDotCompleted,
            ]}
          />
        ))}
      </View>

      {/* Question content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name={currentQuestion.icon} size={80} color="#16a34a" />
        </View>

        <Text style={styles.question}>{currentQuestion.question}</Text>
        <Text style={styles.description}>{currentQuestion.description}</Text>
      </View>

      {/* Answer buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.buttonNo]}
          onPress={() => handleAnswer(false)}
        >
          <Ionicons name="close" size={24} color="#ef4444" />
          <Text style={[styles.buttonText, styles.buttonTextNo]}>No thanks</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonYes]}
          onPress={() => handleAnswer(true)}
        >
          <Ionicons name="checkmark" size={24} color="white" />
          <Text style={[styles.buttonText, styles.buttonTextYes]}>Yes, please!</Text>
        </TouchableOpacity>
      </View>

      {/* Step indicator */}
      <Text style={styles.stepIndicator}>
        {currentStep + 1} of {questions.length}
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingHorizontal: 24,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    color: colors.text.tertiary,
    fontSize: 16,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
    gap: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.neutral[200],
  },
  progressDotActive: {
    backgroundColor: colors.primary[600],
    width: 24,
  },
  progressDotCompleted: {
    backgroundColor: colors.primary[600],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.background.eco,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  question: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  description: {
    fontSize: 16,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 20,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonNo: {
    backgroundColor: colors.error.light,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  buttonYes: {
    backgroundColor: colors.primary[600],
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextNo: {
    color: colors.error.main,
  },
  buttonTextYes: {
    color: 'white',
  },
  stepIndicator: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    paddingBottom: 30,
  },
});

export default OnboardingScreen;
