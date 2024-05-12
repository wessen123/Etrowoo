<?php

/**
 * @package   Automatic_Order_Tasks
 */
/*
Plugin Name: Entrowoo
Plugin URI: https://github.com/wessen123
Description: Automation toolkit for seamless integration of online stores with Entro platform
Version: 2.0.0
Author: Wondwessen "Wessen" Haile
Author URI: https://wondwessenhaileinnovates.net/
*/

if (!defined('ABSPATH')) exit; // Exit if accessed directly

/** Globals **/
define('AOTFW_PLUGIN_NAME', 'EntroWoo');
define('EAOTFW_VERSION', '2.0.0');
define('AOTFW_PLUGIN_URL', plugin_dir_url(__FILE__));
define('AOTFW_PLUGIN_PATH', wp_normalize_path(plugin_dir_path(__FILE__)));
define('AOTFW_LOG_ID_OPTIONS_KEY', '_aotfw-logid');
define('AOTFW_LOG_FOLDER_PREFIX', 'aotfw-log-');

if (!class_exists('Entro_Automatic_Order_Tasks')) {
    class Entro_Automatic_Order_Tasks
    {
        public function __construct()
        {
            // Activation hook
            register_activation_hook(__FILE__, array($this, 'activate'));

            // Deactivation hook
            register_deactivation_hook(__FILE__, array($this, 'deactivate'));

            add_action('init', array($this, 'init'));
        }

        public function init()
        {
            if (!class_exists('woocommerce')) return; // Skip if WooCommerce is not active

            require_once(AOTFW_PLUGIN_PATH . 'inc/class-bootstrap.php');
            AOTFW_Bootstrap::get_instance();
        }

        public function activate()
        {
        }
        public function deactivate()
        {
        }
    }
}

new Entro_Automatic_Order_Tasks();


function entrowoo_add_plugin_site_link($links, $file)
{
    if (plugin_basename(__FILE__) === $file) {
        $plugin_site_url = 'https://wondwessenhaileinnovates.net'; // Replace with your plugin site URL
        $view_site_link = '<a href="' . esc_url($plugin_site_url) . '" target="_blank">' . __('View Plugin Site', 'entrowoo') . '</a>';
        $links[] = $view_site_link;
    }
    return $links;
}
