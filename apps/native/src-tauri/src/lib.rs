// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::time::Duration;
use tauri::command;
use reqwest::Client;
use reqwest::header::{HeaderMap, HeaderName, HeaderValue};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::str::FromStr;

// Original greeting command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Command to proxy API requests from JS to the Next.js server
#[derive(Debug, Serialize, Deserialize)]
struct ProxyRequest {
    url: String,
    method: String,
    headers: Option<HashMap<String, String>>,
    body: Option<String>,
    timeout_ms: Option<u64>,
}

#[derive(Debug, Serialize)]
struct ProxyResponse {
    status: u16,
    headers: HashMap<String, String>,
    body: String,
    error: Option<String>,
}

#[command]
async fn proxy_api(request: ProxyRequest) -> Result<ProxyResponse, String> {
    println!("📡 Proxy API request to: {}", request.url);
    
    // Create a client with default configuration
    let client = match Client::builder()
        .timeout(Duration::from_millis(request.timeout_ms.unwrap_or(30000)))
        .build() {
        Ok(client) => client,
        Err(e) => return Err(format!("Failed to create HTTP client: {}", e)),
    };
    
    // Create the request object based on the method
    let mut req = match request.method.to_uppercase().as_str() {
        "GET" => client.get(&request.url),
        "POST" => client.post(&request.url),
        "PUT" => client.put(&request.url),
        "DELETE" => client.delete(&request.url),
        "PATCH" => client.patch(&request.url),
        "HEAD" => client.head(&request.url),
        _ => return Err(format!("Unsupported HTTP method: {}", request.method)),
    };
    
    // Add headers if provided
    if let Some(headers) = request.headers {
        let mut header_map = HeaderMap::new();
        for (key, value) in headers {
            let header_name = match HeaderName::from_str(&key) {
                Ok(name) => name,
                Err(e) => {
                    println!("Invalid header name {}: {}", key, e);
                    continue;
                }
            };
            
            let header_value = match HeaderValue::from_str(&value) {
                Ok(value) => value,
                Err(e) => {
                    println!("Invalid header value for {}: {}", key, e);
                    continue;
                }
            };
            
            header_map.insert(header_name, header_value);
        }
        req = req.headers(header_map);
    }
    
    // Add body if provided for methods that support it
    if let Some(body) = request.body {
        if request.method.to_uppercase() != "GET" && request.method.to_uppercase() != "HEAD" {
            req = req.body(body);
        }
    }
    
    // Send the request
    let response = match req.send().await {
        Ok(resp) => resp,
        Err(e) => {
            println!("Failed to send request: {}", e);
            return Err(format!("Request failed: {}", e));
        }
    };
    
    // Extract response status
    let status = response.status().as_u16();
    
    // Extract response headers
    let mut response_headers = HashMap::new();
    for (name, value) in response.headers() {
        if let Ok(value_str) = value.to_str() {
            response_headers.insert(name.as_str().to_string(), value_str.to_string());
        }
    }
    
    // Extract response body
    let response_body = match response.text().await {
        Ok(body) => body,
        Err(e) => {
            println!("Failed to read response body: {}", e);
            return Err(format!("Failed to read response body: {}", e));
        }
    };
    
    println!("📡 Proxy API response status: {}", status);
    
    // Return the response
    Ok(ProxyResponse {
        status,
        headers: response_headers,
        body: response_body,
        error: None,
    })
}

// Command to test API connectivity - tries multiple URLs
#[command]
async fn test_api_connection(url: String) -> Result<bool, String> {
    println!("Testing API connection to: {}", url);
    
    let client = match Client::builder()
        .timeout(Duration::from_secs(5))
        .build() {
        Ok(client) => client,
        Err(e) => return Err(format!("Failed to create HTTP client: {}", e)),
    };
    
    // Try the original URL first
    match client.get(&url).send().await {
        Ok(response) => {
            println!("Connection test successful! Status: {}", response.status());
            return Ok(response.status().is_success());
        },
        Err(e) => {
            println!("Connection to {} failed: {}", url, e);
            // Continue to try alternative URLs
        }
    }
    
    // Extract base URL and path
    let parts: Vec<&str> = url.split("/api/").collect();
    if parts.len() < 2 {
        return Err(format!("Could not parse URL: {}", url));
    }
    
    let base = parts[0];
    let path = format!("/api/{}", parts[1]);
    
    // Try alternative host addresses with same path
    let alternative_hosts = vec![
        "http://localhost:3000",
        "http://127.0.0.1:3000", 
        "http://0.0.0.0:3000"
    ];
    
    for alt_host in alternative_hosts {
        if alt_host == base {
            continue; // Skip if it's the same as the original URL
        }
        
        let alt_url = format!("{}{}", alt_host, path);
        println!("Trying alternative URL: {}", alt_url);
        
        match client.get(&alt_url).send().await {
            Ok(response) => {
                println!("Connection to {} successful! Status: {}", alt_url, response.status());
                return Ok(response.status().is_success());
            },
            Err(e) => {
                println!("Connection to {} failed: {}", alt_url, e);
                // Try next URL
            }
        }
    }
    
    // If we get here, all attempts failed
    Err("Failed to connect to any server URL".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet, 
            proxy_api,
            test_api_connection
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
