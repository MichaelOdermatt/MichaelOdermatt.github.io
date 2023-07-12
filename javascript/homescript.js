// TODO rename some of the ids?
const selectors = Object.freeze({
    monitor: {
        parent: '#monitor',
        screen: '#monitor_screen',
        screenText: '#screen_text',
        powerBtnLight: '#monitor_power_button_light',
    },
    plugElement: '#plug',
    cord: {
        path: '#cord',
        svg: '#cord_svg',
        endDiv: '#cord_end',
        cordMeetsMonitor: '#cord_meets_monitor',
        largeProng: '#large_prong_male',
        smallProng: '#small_prong_male',
    },
    boundryBox: '#boundry_box', // TODO should this be bounding box?
    socketDiv: '#socket_div',
    touchscreenBtn: '#touchscreen_button',
});
 
//get cord end div
var cord_end_div = document.querySelector(selectors.cord.endDiv);

// initialize a plug object
function plug_object(plug_offset_x, plug_offset_y, plug_element, cord_svg_id, cord_element_id, cord_shadow_id, play_area_floor, play_area_ceil, play_area_wall_left, play_area_wall_right, click_sound_name) {
    this.is_plugged_in = false;
    this.is_holding = false;
    this.is_hovering = false;
    this.plug_x = 0;
    this.plug_y = 0;
    this.plug_offset_x = plug_offset_x;
    this.plug_offset_y = plug_offset_y;
    this.cord_offset_min = 100;
    this.cord_offset_max = 200;
    this.cord_shadow_offset = 50;
    this.cord_svg_ceil = getElementOffset(document.querySelector(selectors.monitor.parent)).top;
    this.play_area_floor = play_area_floor;
    this.play_area_ceil = play_area_ceil;
    this.play_area_wall_left = play_area_wall_left;
    this.play_area_wall_right = play_area_wall_right;
    this.plug_element = document.querySelector("#" + plug_element);
    this.cord_element = document.querySelector("#" + cord_element_id)
    this.cord_svg = document.querySelector("#" + cord_svg_id)
    this.cord_shadow_element = document.querySelector("#" + cord_shadow_id)
    this.socket_offset_from_center_y = 31;
    this.socket_offset_from_wall_left_x = 0;
    this.socket_hitbox_size = 5;
    this.socket_x = 0;
    this.socket_y = 0;
    this.depth_of_socket = 36;
    this.cord_svg_border_size = 5;
    this.small_prong_female_x_offset = 9;
    this.has_sound_click_played = false;
    this.sound_click = new Audio("sounds/" + click_sound_name);

    // function to encapsulate all plug movement logic
    this.move_plug = function (new_x, new_y) {
        this.update_plug_position(new_x, new_y)
        this.check_plug_collision();
        this.update_plug_element_position();
        this.update_cord();
    }

    // function to update the x and y of the plug
    this.update_plug_position = function (newX, newY) {
        this.plug_x = newX - this.plug_offset_x;
        this.plug_y = newY - this.plug_offset_y;
    }

    // update the position of the SVG representing the plug with the plug objects x and y
    this.update_plug_element_position = function () {
        this.plug_element.style.left = `${this.plug_x}px`;
        this.plug_element.style.top = `${this.plug_y}px`;
    }

    // function to update cord position
    this.update_cord = function () {

        // move the svg element
        this.cord_svg.style.left = `${this.play_area_wall_left}px`;
        this.cord_svg.style.top = `${this.cord_svg_ceil}px`;

        // resize the svg element to match the bounding box
        this.cord_svg.setAttribute('width', this.play_area_wall_right - this.play_area_wall_left + this.cord_svg_border_size + "px");
        this.cord_svg.setAttribute('height', this.play_area_floor - this.cord_svg_ceil + this.cord_svg_border_size + "px");

        // calculate the end point and start point coordinates
        var cord_end_x = getElementOffset(document.querySelector(selectors.cord.cordMeetsMonitor)).left - this.play_area_wall_left;
        var cord_end_y = getElementOffset(document.querySelector(selectors.cord.cordMeetsMonitor)).top - this.cord_svg_ceil;

        var cord_start_x = (this.plug_x + this.plug_offset_x) - this.play_area_wall_left;
        var cord_start_y = (this.plug_y + this.plug_offset_y) - this.cord_svg_ceil;

        // calculate the curve for the path
        var curve = this.calc_curve(cord_start_x, cord_start_y, cord_end_x, cord_end_y, cord_end_x);

        // draw the shadow element
        //this.draw_shadow(cord_start_x, cord_end_x);

        this.cord_element.setAttribute("d", curve)
    }

    // update the boundries of the play area
    this.update_play_area = function () {
        this.play_area_floor = getElementOffset(document.querySelector(selectors.boundryBox)).top + getAbsoluteHieght(document.querySelector('#boundry_box'));
        this.play_area_ceil = getElementOffset(document.querySelector(selectors.boundryBox)).top;
        this.play_area_wall_left = getElementOffset(document.querySelector(selectors.socketDiv)).left + getAbsoluteWidth(document.querySelector('#socket_div')) / 2;
        this.play_area_wall_right = getElementOffset(document.querySelector(selectors.boundryBox)).left + getAbsoluteWidth(document.querySelector('#boundry_box'));
    }

    this.update_cord_svg_ceil = function () {
        this.cord_svg_ceil = getElementOffset(document.querySelector(selectors.monitor.parent)).top;
    }

    // check if the plug is colliding with any of the play area boundries
    this.check_plug_collision = function () {
        if (this.is_plugged_in == false) {

            // check collision with play area walls
            this.check_hit_floor();
            this.check_hit_ceil();
            this.check_hit_wall_left();
            this.check_hit_wall_right();

            this.is_plugged_in = this.has_plug_hit_socket();

        } else {

            // if the socket is plugged in, lock its y value and change the left and right boundries
            this.plug_y = this.socket_y;
            this.check_hit_end_of_socket();
            this.check_hit_wall_right();
            this.shift_prongs();
            this.is_plugged_in = this.has_plug_exited_socket();
        }
    }

    // function to prevent plug from exceeding its upper Y boundry
    this.check_hit_floor = function () {
        var boundry = this.play_area_floor - this.plug_element.getAttribute("height");
        this.plug_y = this.constrain_upper(this.plug_y, boundry)
    }

    // function to prevent plug from exceeding its lower Y boundry
    this.check_hit_ceil = function () {
        this.plug_y = this.constrain_lower(this.plug_y, this.play_area_ceil)
    }

    // function to prevent plug from exceeding its lower X boundry
    this.check_hit_wall_left = function () {
        this.plug_x = this.constrain_lower(this.plug_x, this.play_area_wall_left)

    }

    // check if you have collided with the socket hitbox
    this.has_plug_hit_socket = function () {
        var socket_hitbox_y_lower = (this.socket_y) - this.socket_hitbox_size;
        var socket_hitbox_y_upper = (this.socket_y) + this.socket_hitbox_size;

        if (this.plug_y <= socket_hitbox_y_upper && this.plug_y >= socket_hitbox_y_lower && this.plug_x == this.play_area_wall_left) {
            return true;
        } else {
            return false;
        }
    }

    // checks if the plug is pulled out far enough (if plug_x exceeds the left wall by 1 or more units)
    this.has_plug_exited_socket = function () {
        if (this.plug_y == this.socket_y && this.plug_x >= this.play_area_wall_left + 1) {
            return false;
        } else {
            return true;
        }
    }

    // function to prevent plug from exceeding its lower X socket boundry
    this.check_hit_end_of_socket = function () {
        var boundry = this.play_area_wall_left - this.depth_of_socket;

        this.plug_x = this.constrain_lower(this.plug_x, boundry)
        this.play_sound_click_if_hit_boundry(this.plug_x, boundry);
    }

    // function to prevent plug from exceeding its upper X boundry
    this.check_hit_wall_right = function () {
        var boundry = this.play_area_wall_right - this.plug_element.getAttribute("width");
        this.plug_x = this.constrain_upper(this.plug_x, boundry)
    }

    // if a value has hit a limit, play the click sound
    this.play_sound_click_if_hit_boundry = function (value, constraint) {
        if (value == constraint && this.has_sound_click_played == false) {
            this.sound_click.play();
            this.has_sound_click_played = true;
            this.screen_on();
        }

        if (value != constraint && this.has_sound_click_played == true) {
            this.has_sound_click_played = false;
            this.screen_off();
        }
    }

    // constrains a value to a upper boundry
    this.constrain_upper = function (value, constraint) {
        if (value > constraint) {
            return constraint;
        } else {
            return value
        }
    }

    // constrains a value to a lower boundry
    this.constrain_lower = function (value, constraint) {
        if (value < constraint) {
            return constraint;
        } else {
            return value
        }
    }

    // calculate quadratic
    this.calc_curve = function (cord_start_x, cord_start_y, cord_end_x, cord_end_y, cord_length_max) {

        // mid-point of line
        var mpx = (cord_end_x + cord_start_x) * 0.5;
        var mpy = (cord_end_y + cord_start_y) * 0.5;

        // angle perpendicular to the horizontal
        var theta = Math.atan2(0, cord_end_x - cord_start_x) - Math.PI / 2;

        // flips the offset sign depending on which point is bigger on the x axis
        var offset = -800;

        if (cord_start_x > cord_end_x) {
            offset *= -1;
        }

        // location of control point
        var c1x = mpx + offset * Math.cos(theta);
        var c1y = mpy + offset * Math.sin(theta);
        c1y = this.constrain_upper(c1y, this.get_cord_svg_height());

        return "M" + cord_start_x + " " + cord_start_y + " Q " + c1x + " " + c1y + " " + cord_end_x + " " + cord_end_y;
    }

    // calculates distance of control point from mid-point of line
    this.calc_offset = function (cord_start_x, cord_end_x, cord_start_y, cord_start_y, cord_length_max) {
        var length_of_x = Math.pow(cord_end_x - cord_start_x, 2);
        var length_of_y = Math.pow(cord_end_y - cord_start_y, 2);
        var length_of_cord = Math.sqrt(length_of_x + length_of_y);

        var cord_length_ratio = 1 - (length_of_cord / cord_length_max);

        return -1 * ((cord_length_ratio * this.cord_offset_max) + this.cord_offset_min);
    }

    // TODO this can be deleted
    // draw the shadow for the cord and plug
    this.draw_shadow = function (cord_start_x, cord_end_x) {
        this.cord_shadow_element.setAttribute("x1", cord_start_x - this.cord_shadow_offset);
        this.cord_shadow_element.setAttribute("x2", cord_end_x);
        this.cord_shadow_element.setAttribute("y1", this.get_cord_svg_height());
        this.cord_shadow_element.setAttribute("y2", this.get_cord_svg_height());
    }

    // function for when the screen turns on
    this.screen_on = function () {
        document.querySelector(selectors.monitor.screen).setAttribute("fill", "#FFFFFA");
        document.querySelector(selectors.monitor.screen).setAttribute("stroke", "#FFFFFA");
        document.querySelector(selectors.monitor.powerBtnLight).setAttribute("fill", "#86cc8a");
        document.querySelector(selectors.monitor.screenText).setAttribute("class", "");
    }

    // function for when the screen turns off
    this.screen_off = function () {
        document.querySelector(selectors.monitor.screen).setAttribute("fill", "#9A9286");
        document.querySelector(selectors.monitor.screen).setAttribute("stroke", "#9A9286");
        document.querySelector(selectors.monitor.powerBtnLight).setAttribute("fill", "#9A8686");
        document.querySelector(selectors.monitor.screenText).setAttribute("class", "visibility-none");
    }

    // function to handle the shifting prongs
    this.shift_prongs = function () {
        var female_large_prong_x = this.play_area_wall_left;
        var small_prong_female_x = this.play_area_wall_left - this.small_prong_female_x_offset;

        var male_large_prong_x = this.plug_x;
        var small_prong_male_x = this.plug_x - this.small_prong_female_x_offset;

        // if the male prongs have moved past the female prongs
        if (female_large_prong_x >= male_large_prong_x) {
            var offset_large = female_large_prong_x - male_large_prong_x;
            var offset_small = small_prong_female_x - small_prong_male_x;

            document.querySelector(selectors.cord.largeProng).setAttribute("x", offset_large);
            document.querySelector(selectors.cord.smallProng).setAttribute("x", offset_small + this.small_prong_female_x_offset);
        } else {
            document.querySelector(selectors.cord.largeProng).setAttribute("x", 0);
            document.querySelector(selectors.cord.smallProng).setAttribute("x", this.small_prong_female_x_offset);
        }
    }

    // update socket and its hitboxes x and y values
    this.update_socket_position = function () {
        this.socket_x = this.play_area_wall_left - this.socket_offset_from_wall_left_x;
        this.socket_y = this.get_play_area_height_half() + this.play_area_ceil - this.socket_offset_from_center_y;
    }

    // encapsulating function for updating the play area and its requried parameters
    this.update_screen_dependent_variables = function () {
        this.update_play_area();
        this.update_cord_svg_ceil();
        this.update_socket_position();
    }

    // instantly moves the plug to the socket
    this.move_plug_to_socket = function () {
        this.is_plugged_in = true;
        this.move_plug(this.socket_x, this.socket_y);
    }

    //getters and setters
    this.set_is_holding = function (bool) {
        this.is_holding = bool;
    }

    this.set_is_hovering = function (bool) {
        this.is_hovering = bool;
    }

    this.get_is_holding = function () {
        return this.is_holding;
    }

    this.get_is_hovering = function () {
        return this.is_hovering;
    }

    this.get_is_plugged_in = function () {
        return this.is_plugged_in;
    }

    this.get_play_area_floor = function () {
        return this.play_area_floor;
    }

    this.get_play_area_ceil = function () {
        return this.play_area_ceil;
    }

    this.get_play_area_center_x = function () {
        return (this.play_area_wall_left + this.play_area_wall_right) / 2;
    }

    this.get_play_area_height_half = function () {
        return (this.play_area_floor - this.play_area_ceil) / 2;
    }

    this.get_play_area_height = function () {
        return this.play_area_floor - this.play_area_ceil;
    }

    this.get_cord_svg_height = function () {
        return this.play_area_floor - this.cord_svg_ceil;
    }
}

// create a plug object
var plug = new plug_object(55, 25, 'plug', "cord_svg", "cord", "cord_shadow", 0, 0, 0, 0, "click.mp3");

// update the boundries of where the plug can exist
plug.update_screen_dependent_variables();
plug.move_plug(plug.get_play_area_center_x(), plug.get_play_area_ceil() + plug.get_play_area_height_half());

// when the mouse cursor is over the plug
plug.plug_element.addEventListener('mouseover', function () {
    plug.set_is_hovering(true);
});

// when the mosue cursor is no longer over the plug
plug.plug_element.addEventListener('mouseout', function () {
    plug.set_is_hovering(false);
});

// when the mouse moves
window.addEventListener('mousemove', (event) => {
    if (plug.get_is_holding()) {
        plug.move_plug(event.pageX, event.pageY);
    }
});

// when the left mouse button is pressed
window.addEventListener('mousedown', () => {
    if (plug.get_is_hovering()) {
        plug.set_is_holding(true);
    }
});

// when the left mouse button is let go
window.addEventListener('mouseup', () => {
    if (plug.get_is_holding()) {
        plug.set_is_holding(false);
    }
});

// button for users on mobile devices (the plug cant be moved on mobile/touchscreen devices)
document.querySelector(selectors.touchscreenBtn).addEventListener('click', (e) => {
    e.preventDefault();
    plug.move_plug_to_socket();
    return false;
});

// on window resize, update the plug position and the bounding box where the plug can exist
window.addEventListener('resize', () => {
    plug.update_screen_dependent_variables();
    plug.move_plug(plug.plug_x, plug.plug_y);
});
