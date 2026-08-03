-- Function to redeem plan from lucky spin
CREATE OR REPLACE FUNCTION redeem_plan_from_spin(
  p_user_id UUID,
  p_plan_slug TEXT
)
RETURNS VOID AS $$
DECLARE
  plan_record RECORD;
  expiry_date TIMESTAMPTZ;
  existing_subscription RECORD;
BEGIN
  -- Get plan details
  SELECT * INTO plan_record FROM plans WHERE slug = p_plan_slug;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found';
  END IF;

  -- Calculate expiry date
  expiry_date := NOW() + (COALESCE(plan_record.duration_days, 30) || ' days')::INTERVAL;

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
  SET plan_slug = p_plan_slug,
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;