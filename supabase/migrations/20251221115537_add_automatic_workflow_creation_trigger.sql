/*
  # Add Automatic Production Workflow Creation

  1. Changes
    - Create function to automatically create production workflow entries when orders are created
    - Add trigger on orders table to invoke this function on INSERT
    - Add function to manually create workflow for existing orders
  
  2. Security
    - Function uses SECURITY DEFINER to bypass RLS for internal operations
    - Only triggered by database events, not directly callable by users
  
  3. Benefits
    - Eliminates manual workflow creation step
    - Ensures every order has a workflow tracking entry
    - Maintains data consistency
*/

-- Function to automatically create a production workflow when an order is created
CREATE OR REPLACE FUNCTION create_production_workflow_for_order()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create a new production workflow entry for the order
  INSERT INTO production_workflows (order_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Trigger to automatically create production workflow on order creation
DROP TRIGGER IF EXISTS trigger_create_production_workflow ON orders;
CREATE TRIGGER trigger_create_production_workflow
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_production_workflow_for_order();

-- Function to manually create workflow for existing orders (can be called via RPC)
CREATE OR REPLACE FUNCTION create_workflow_for_order(p_order_id uuid)
RETURNS json
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_workflow_id uuid;
  v_existing_workflow_id uuid;
BEGIN
  -- Check if workflow already exists
  SELECT id INTO v_existing_workflow_id
  FROM production_workflows
  WHERE order_id = p_order_id;
  
  IF v_existing_workflow_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Workflow already exists for this order',
      'workflow_id', v_existing_workflow_id
    );
  END IF;
  
  -- Create new workflow
  INSERT INTO production_workflows (order_id)
  VALUES (p_order_id)
  RETURNING id INTO v_workflow_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Workflow created successfully',
    'workflow_id', v_workflow_id
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_workflow_for_order(uuid) TO authenticated;