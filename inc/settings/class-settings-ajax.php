<?php 



if ( !defined( 'ABSPATH' ) ) exit; // exit if accessed directly



if ( !class_exists('AOTFW_Settings_Ajax') ) {

  /**

   * Class holding the ajax accessed functions for order tasks

   *

   *

   * @since     1.0.0

   * @package   Entro  Automatic_Order_Tasks

   * @subpackage Entro Automatic_Order_Tasks/settings

   * @author     wwwww

   */

  class AOTFW_Settings_Ajax {



    private static $instance;



    private function __construct(){

      $this->expose_ajax_functions();

    }





    public static function get_instance() {

      if ( !self::$instance ) {

        $instance = new AOTFW_Settings_Ajax();

      }

      return $instance;

    }





    public function ajax_get_order_tasks_config() {

      $this->check_request_allowed();

      

      $id = sanitize_text_field( $_GET['id'] ) ?? null;



      if ( empty($id) ) {

        http_response_code( 400 );

        die( 'Missing ID parameter in request' );

      }



      $config = AOTFW_Settings_Api::get_instance()->get_config($id);

      $escaped_config = $this->escape_config( $config );

      

      echo json_encode( $escaped_config, JSON_UNESCAPED_SLASHES );

      die();

    }





    public function ajax_post_order_tasks_config() {

      $this->check_request_allowed();



      $data = json_decode( wp_unslash( $_POST['data'] ), true ); // will get sanitized before save
     
  

      if ( $data === null ) {

        wp_send_json_error( esc_html( __('Invalid JSON data in request', 'aotfw-domain') ), 400 );

      }



      // check if input order status exists exists

      $order_status_input = sanitize_text_field( $data['orderStatus'] ) ?? null;



      $order_statuses = wc_get_order_statuses();



      if ( !array_key_exists( $order_status_input, $order_statuses ) ) {

        wp_send_json_error( esc_html( __('The requested order status does not exist', 'aotfw-domain') ), 404 );

      }



      // create unique ids for each task

      $data['config'] = $this->create_task_uniqids( $data['config'] );



      // sanitize and save

      $sanitized_config = $this->sanitize_config( $data['config'] );

      AOTFW_Settings_Api::get_instance()->update_config( $order_status_input, $sanitized_config );

     

      wp_send_json_success(array( 'message' => esc_html( __("Success! Settings for", 'aotfw-domain') . ' ' . $order_status_input . ' ' .  __("have been updated.", 'aotfw-domain') ) ) );

    }



    public function ajax_get_post_categories() {

      $product_attributes = AOTFW_Settings_Api::get_instance()->get_post_categories();

    // Initialize an empty array to store the mapped attributes
    $mapped_attributes = array();

    // Loop through each product attribute and its nested attributes
    foreach ($product_attributes as $attribute => $nested_attributes) {
        // Initialize an empty array to store the mapped nested attributes
        $mapped_nested_attributes = array();

        // Loop through nested attributes and escape them
        foreach ($nested_attributes as $nested_attribute) {
            $mapped_nested_attributes[] = esc_attr($nested_attribute);
        }

        // Store the mapped attribute and its mapped nested attributes
        $mapped_attributes[] = array(
            'attribute' => esc_attr($attribute),
            'nested_attributes' => $mapped_nested_attributes,
        );
    }

    // Encode the mapped attributes as JSON and echo
    echo json_encode($mapped_attributes);
    die();

    }


    public function ajax_get_users() {

      $users = AOTFW_Settings_Api::get_instance()->get_users();

      $users_escaped = array_map( function( $user ) { // escape

        $e_user['ID'] = esc_attr( $user->ID );

        $e_user['display_name'] = esc_html( $user->display_name );

        return $e_user; 

      }, $users );

      echo json_encode( $users_escaped );

      die();

    }



    public function ajax_get_shipping_methods() {

      $shipping_methods = AOTFW_Settings_Api::get_instance()->get_shipping_methods();

      $shipping_methods_escaped = array_map( function( $method ) { // escape

        $e_method['id'] = esc_attr( $method['id'] );

        $e_method['method_title'] = esc_attr( $method['method_title'] );

        return $e_method;

      }, $shipping_methods );

      echo json_encode( $shipping_methods_escaped );

      die();

    }



    private function check_request_allowed() {

      if ( !(check_ajax_referer('eam-nonce', false, false) && current_user_can( 'manage_options' ) ) ) {

        wp_send_json_error( esc_html( __('Access denied. You might need to refresh your browser page') ), 403 );

      }



      $rm = $_SERVER['REQUEST_METHOD'];

      $rm = sanitize_text_field( $rm );



      if ($rm !== 'GET' && !isset($_POST['data'] ) ) {

        wp_send_json_error( esc_html( __('Data missing in request.', 'aotfw-domain') ), 400 );

      }

    }



    private function expose_ajax_functions() {

      add_action( 'wp_ajax_eam_get_order_tasks_config', array( $this, 'ajax_get_order_tasks_config' ) );

      add_action( 'wp_ajax_eam_post_order_tasks_config', array( $this, 'ajax_post_order_tasks_config' ) );

      add_action( 'wp_ajax_eam_get_post_categories', array( $this, 'ajax_get_post_categories' ) );

      add_action( 'wp_ajax_eam_get_users', array( $this, 'ajax_get_users' ) );

      add_action( 'wp_ajax_eam_get_shipping_methods', array( $this, 'ajax_get_shipping_methods' ) );

    }



    private function create_task_uniqids( $config ) {

      if ( is_array( $config ) ) {

        foreach ( $config as $index => $task_config ) {

          if ( !empty( $task_config ) && isset( $task_config['id'] ) ) {

            $task_config['uniqid'] = uniqid('', false);

            $config[$index] = $task_config;

          }

        }

      }



      return $config;

    }



    private function sanitize_config( $config ) {

      $this->require_tasks();

      

      $sanitized_config = array();

      $task_factory = AOTFW_Order_Task_Factory::get_instance();

      if ( is_array( $config ) ) {

        foreach ( $config as $task_config ) {

          if ( !empty( $task_config ) && isset( $task_config['id'] ) ) {

            $sanitized_id = sanitize_text_field( $task_config['id'] );

            $task = $task_factory->get( $sanitized_id, $task_config['fields'] );



            $sanitized_config[] = array(

              'id' => $sanitized_id,

              'uniqid' => $task_config['uniqid'] ?? '',

              'fields' => $task->get_args_sanitized(),

              'metaSettings' => $this->sanitize_config_meta_settings( $task_config['metaSettings'] ?? null )

            );

          }

        }

      }



      return $sanitized_config;

    }



    private function escape_config( $config ) {

      $this->require_tasks();



      $escaped_config = array();

      $task_factory = AOTFW_Order_Task_Factory::get_instance();

      if ( is_array( $config ) ) {

        foreach ( $config as $task_config ) {

          if ( !empty( $task_config ) && isset( $task_config['id'] ) ) {

            $task = $task_factory->get( $task_config['id'], $task_config['fields'] );

            $escaped_config[] = array(

              'id' => $task_config['id'],

              'fields' => $task->get_args_sanitized_escaped(),

              'metaSettings' => $this->sanitize_config_meta_settings( $task_config['metaSettings'] ?? null ) );

          }

        }

      }

 

      return $escaped_config;

    }



    private function sanitize_config_meta_settings( $meta_settings ) {

      $sanitized_meta_settings = array();



      $run_once_setting = $meta_settings['runonce'] ?? false;

      $sanitized_meta_settings['runonce'] = $run_once_setting === true ?? false;



      return $sanitized_meta_settings;

    }



    private function require_tasks() {

      require_once( AOTFW_PLUGIN_PATH . 'inc/tasks/class-order-task.php' );

      require_once( AOTFW_PLUGIN_PATH . 'inc/tasks/class-order-task-factory.php' );

    }

  }

}





?>