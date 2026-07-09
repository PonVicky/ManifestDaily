import { Redirect } from 'expo-router';
import { CHALLENGE_SOURCE } from '../constants/deepLinks';

export default function ChallengeRedirect() {
  return <Redirect href={{ pathname: '/(tabs)/focus', params: { source: CHALLENGE_SOURCE } }} />;
}
