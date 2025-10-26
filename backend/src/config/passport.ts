import passport from 'passport';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import User, { IUser } from '../models/User';

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      callbackURL: process.env.LINKEDIN_CALLBACK_URL || '',
      scope: ['r_emailaddress', 'r_liteprofile'],
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ linkedinId: profile.id });

        if (user) {
          // Update existing user with latest profile data
          user.displayName = profile.displayName;
          user.email = profile.emails?.[0]?.value || user.email;
          user.firstName = profile.name?.givenName || '';
          user.lastName = profile.name?.familyName || '';
          user.profilePicture = profile.photos?.[0]?.value || '';
          user.rawProfileData = profile;
          await user.save();
        } else {
          // Create new user
          user = await User.create({
            linkedinId: profile.id,
            displayName: profile.displayName,
            email: profile.emails?.[0]?.value || '',
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            profilePicture: profile.photos?.[0]?.value || '',
            rawProfileData: profile,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;
