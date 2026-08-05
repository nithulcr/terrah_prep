-- ============================================
-- LUCKY SPIN RPC FUNCTION
-- ============================================

-- Create the spin_lucky_wheel RPC function
CREATE OR REPLACE FUNCTION spin_lucky_wheel(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  spin_cost INTEGER := 100;
  current_available INTEGER;
  random_value FLOAT;
  reward_type TEXT;
  reward_value TEXT;
  plan_slug TEXT;
  plan_duration INTEGER;
  expiry_date TIMESTAMPTZ;
  existing_subscription RECORD;
  plan_record RECORD;
BEGIN
  -- Check if user has enough points
  SELECT available_points INTO current_available
  FROM user_points
  WHERE user_id = p_user_id;

  IF current_available IS NULL OR current_available < spin_cost THEN
    RETURN json_build_object(
      'success', false,
      'error', 'NOT_ENOUGH_POINTS',
      'message', 'You need at least 100 points to spin the Lucky Wheel.'
    );
  END IF;

  -- Deduct spin cost
  UPDATE user_points
  SET available_points = available_points - spin_cost
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO point_transactions (user_id, transaction_type, points, description)
  VALUES (p_user_id, 'lucky_spin', -spin_cost, 'Lucky Spin Wheel - 100 points deducted');

  -- Generate random number between 0 and 100
  random_value := RANDOM() * 100;

  -- Determine reward based on probability
  -- 10 Points: 30% (0-30)
  -- 20 Points: 25% (30-55)
  -- 50 Points: 15% (55-70)
  -- Starter Plan: 10% (70-80)
  -- PRO Plan: 5% (80-85)
  -- Elite Plan: 3% (85-88)
  -- Premium Plan: 2% (88-90)
  -- No Reward: 10% (90-100)

  IF random_value < 30 THEN
    reward_type := 'points';
    reward_value := '10';
    -- Add points
    UPDATE user_points
    SET total_points = total_points + 10,
        available_points = available_points + 10
    WHERE user_id = p_user_id;
    
    INSERT INTO point_transactions (user_id, transaction_type, points, description)
    VALUES (p_user_id, 'spin_reward', 10, 'Lucky Spin Wheel - Won 10 points');
    
  ELSIF random_value < 55 THEN
    reward_type := 'points';
    reward_value := '20';
    -- Add points
    UPDATE user_points
    SET total_points = total_points + 20,
        available_points = available_points + 20
    WHERE user_id = p_user_id;
    
    INSERT INTO point_transactions (user_id, transaction_type, points, description)
    VALUES (p_user_id, 'spin_reward', 20, 'Lucky Spin Wheel - Won 20 points');
    
  ELSIF random_value < 70 THEN
    reward_type := 'points';
    reward_value := '50';
    -- Add points
    UPDATE user_points
    SET total_points = total_points + 50,
        available_points = available_points + 50
    WHERE user_id = p_user_id;
    
    INSERT INTO point_transactions (user_id, transaction_type, points, description)
    VALUES (p_user_id, 'spin_reward', 50, 'Lucky Spin Wheel - Won 50 points');
    
  ELSIF random_value < 80 THEN
    reward_type := 'plan';
    reward_value := 'Starter';
    plan_slug := 'starter';
    
  ELSIF random_value < 85 THEN
    reward_type := 'plan';
    reward_value := 'PRO';
    plan_slug := 'pro';
    
  ELSIF random_value < 88 THEN
    reward_type := 'plan';
    reward_value := 'Elite';
    plan_slug := 'elite';
    
  ELSIF random_value < 90 THEN
    reward_type := 'plan';
    reward_value := 'Premium';
    plan_slug := 'premium';
    
  ELSE
    reward_type := 'none';
    reward_value := 'No Reward';
  END IF;

  -- If reward is a plan, redeem it
  IF reward_type = 'plan' AND plan_slug IS NOT NULL THEN
    -- Get plan details
    SELECT * INTO plan_record FROM plans WHERE slug = plan_slug;
    
    IF FOUND THEN
      -- Calculate expiry date
      plan_duration := COALESCE(plan_record.duration_days, 30);
      expiry_date := NOW() + (plan_duration || ' days')::INTERVAL;

      -- Check for existing subscription
      SELECT * INTO existing_subscription 
      FROM subscriptions 
      WHERE user_id = p_user_id AND status = 'active';

      IF FOUND THEN
        -- Update existing subscription
        UPDATE subscriptions
        SET plan_id = plan_record.id,
            expires_at = expiry_date,
            updated_at = NOW()
        WHERE id = existing_subscription.id;
      ELSE
        -- Create new subscription
        INSERT INTO subscriptions (user_id, plan_id, status, starts_at, expires_at)
        VALUES (p_user_id, plan_record.id, 'active', NOW(), expiry_date);
      END IF;

      -- Update user profile
      UPDATE profiles
      SET plan_slug = plan_slug,
          updated_at = NOW()
      WHERE id = p_user_id;
    END IF;
  END IF;

  -- Record spin history
  INSERT INTO lucky_spin_history (user_id, reward_type, reward_value, points_deducted)
  VALUES (p_user_id, reward_type, reward_value, spin_cost);

  -- Return result
  RETURN json_build_object(
    'success', true,
    'reward_type', reward_type,
    'reward_value', reward_value,
    'points_deducted', spin_cost
  );
END;
$$ LANGUAGE plpgsql;