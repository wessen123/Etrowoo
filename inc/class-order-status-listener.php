<?php

if (!defined('ABSPATH')) exit; // exit if accessed directly



if (!class_exists('AOTFW_Order_Status_Listener')) {

  class AOTFW_Order_Status_Listener
  {



    private static $instance = null;





    private function __construct()
    {

      add_action('woocommerce_order_status_changed', array($this, 'action__do_tasks'), 10, 3);
    }





    public static function get_instance()
    {

      if (!self::$instance) {

        self::$instance = new AOTFW_Order_Status_Listener();
      }

      return self::$instance;
    }




    public function action__do_tasks($order_id, $old_status, $new_status)
    {
      $order_ids_to_filter = [214,212,2261, 179, 35117, 35109, 35087, 35086, 35081, 35079, 35071, 34973, 34971];
      if (in_array($order_id, $order_ids_to_filter)) {
        
        $this->require_tasks(); // requiring tasks late, as the file is only necessary when executing tasks.

        

        $task_factory = AOTFW_Order_Task_Factory::get_instance();

    

        $order = wc_get_order($order_id);
        $items = $order->get_items();
        $afhendingarmati_values = [];
    // Loop through each item
    foreach ($items as $item) {
        // Get product ID
        $product_id = $item->get_product_id();

        // Get product object
        $product = $item->get_product();

        // Check if the product exists
        if ($product) {
            // Get product attributes
            $attributes = $product->get_attributes();

            // Loop through each attribute
            foreach ($attributes as $attribute_name => $attribute) {
                // Get attribute name and value
                $attribute_label = wc_attribute_label($attribute_name);
                if ( $attribute_label === 'Afhendingarmáti' ) {
                  // Get attribute value
                  $attribute_value =  $product->get_attribute($attribute_name);
                  // Store the value in the array
                  $afhendingarmati_values[] = $attribute_value;
              }
            }
         
        }
    }
        $new_array = array();

       foreach ($afhendingarmati_values  as $value) {
        if (strpos($value, ',') !== false) {
            $comma_separated_values = explode(',', $value);
            foreach ($comma_separated_values as $val) {
                $new_array[] = trim($val);
            }
        } else {
            $new_array[] = $value;
        }
        
    }
     var_dump(  $new_array );
     echo 'wesssen '.'</br>';
   $this->check_the_order($task_factory, $order,$new_status, $order_id ,$new_array);
    //die("orders test");    
      }
    }


 private function check_the_order($task_factory,$order,$new_status ,$order_id,$new_array ){



$new_status = 'wc-' . $new_status; // add the wc prefix


$settings_api = AOTFW_Settings_Api::get_instance();
$config = $settings_api->get_config($new_status);



if (!empty($config) && is_array($config)) {
  
 
  $your_array=$config;
  foreach ($your_array as $item) {
    // Check if the current item has the id 'filterorder'
    if (isset($item['id']) && $item['id'] === 'filterorder') {
        // If found, return true
        if (isset($item['fields']['delivery_method'])) {
         //  print_r($item['fields']['delivery_method']) ;
  //die("orders trueeeeeeeee[ppee");
        foreach ($config as $task_config) {
    
          if (!empty($task_config) && isset($task_config['id'])) {
  
          
           
            $common_value = false;
                  foreach ($new_array as $val1) {
                    if (in_array($val1, $item['fields']['delivery_method'])) {
                        $common_value = true;
                        break;
                    }
                  }
  
                  if ($common_value) {
                    echo "Arrays have at least one common value.";     
            if ($this->should_run($order_id, $task_config)) {
  
              $task = $task_factory->get($task_config['id'], $task_config['fields']);
                
                // Iterate through each delivery method and push it into the array
             
             
                  $task->do_task($order);  
                 // print_r( $task ) ;
                  //die($task->do_task($order)."orders trueeeeeeeeeee");
            
               
                
             
               
                 // die('jjj');
                  //$task->do_task($order);
                }
              }
              else {
                echo "Arrays do not have any common value.";
                // die("orders elese");
             }
              }
            }
            }
          }
  }
    }
  

    }
    function convert_to_slug_array($values) {
      $slug_array = [];
      foreach ($values as $value) {
          $slug_array[] = sanitize_title($value);
      }
      return $slug_array;
  }


    /**

     * Determines whether the action should run based on various meta settings.

     * Returns true if so.

     */

    private function should_run($order_id, $task_config)
    {
     
      if (empty($task_config['metaSettings'])) // return true if no meta setting limiters are set.

        return true;



      $meta_settings = $task_config['metaSettings'];



      if ($meta_settings['runonce'] === true && !empty($task_config['uniqid'])) {

        $ran_tasks_pm = get_post_meta($order_id, '_aotfw_done_runonce_tasks', true);

        $ran_tasks = empty($ran_tasks_pm) ? array() : explode(',', $ran_tasks_pm);



        if (in_array($task_config['uniqid'], $ran_tasks)) {

          return false; // if already run, it should not run again.

        } else {

          // else add it to the list of already run tasks.

          $ran_tasks[] = $task_config['uniqid'];

          update_post_meta($order_id, '_aotfw_done_runonce_tasks', implode(',', $ran_tasks));
        }
      }



      return true;
    }



    private function require_tasks()
    {

      require_once(AOTFW_PLUGIN_PATH . 'inc/tasks/class-order-task.php');

      require_once(AOTFW_PLUGIN_PATH . 'inc/tasks/class-order-task-factory.php');
    }
  }
}
