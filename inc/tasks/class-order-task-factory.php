<?php



if ( !defined( 'ABSPATH' ) ) exit; // exit if accessed directly





if ( !class_exists( 'AOTFW_Order_Task_Factory' ) ) {

    /**

   * Factory class for creating new instances of an order task

   *

   *

   * @since      2.0.0

   * @package    Automatic_Order_Tasks

   * @subpackage Automatic_Order_Tasks/settings

   * @author     Wondwessen H (wessen333@gmail.com)

   */

  class AOTFW_Order_Task_Factory {

    private static $instance;

    private $task_map = array(

      'sendmail' => 'AOTFW_Sendmail_Order_Task',

     // 'createpost' => 'AOTFW_Createpost_Order_Task',
      'storeorder' => 'AOTFW_Storeorder_Order_Task',


      'logtofile' => 'AOTFW_Logtofile_Order_Task',

      //'customorderfield' => 'AOTFW_Customorderfield_Order_Task',

      //'changeshipping' => 'AOTFW_Changeshipping_Order_Task',

      'sendwebhook' => 'AOTFW_Sendwebhook_Order_Task',

      'trashorder' => 'AOTFW_Trashorder_Order_Task',
      'filterorder' => 'AOTFW_Filterorder_Order_Task',
      'sendentro' => 'AOTFW_Sendentro_Order_Task' ,// Add the new task here
      //'orderdelivery' => 'AOTFW_Orderdelivery_Order_Task',
      'sendsms' => 'AOTFW_Sendsms_Order_Task',

    );



    private function __construct() {

    }



    public static function get_instance() {

      if ( !self::$instance ) {

        self::$instance = new AOTFW_Order_Task_Factory();

      }

      return self::$instance;

    }



    public function get( $task_id, $args = array() ) {

      $classname = $this->task_map[$task_id];

      if ( !empty( $classname ) && class_exists( $classname ) ) {

        return new $classname( $args );

      } else {

        error_log( 'task: ' . $task_id . ' not found in factory map' );

      }

    }



  }

}



?>