import yahooFinance from "yahoo-finance2";

export interface MarketTickerItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface AssetSearchResult {
  symbol: string;
  name: string;
  exchange?: string;
  type?: string;
  price?: number;
}

// Common tickers to display in the UI by default
const TICKER_SYMBOLS = [
  'SPY',   // S&P 500 ETF
  'DIA',   // Dow Jones ETF
  'BTC-USD', // Bitcoin
  'ETH-USD', // Ethereum
];

// Most popular assets to suggest when searching - expanded collection
const POPULAR_ASSETS = [
  // Major US Indices ETFs
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', type: 'ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust (Nasdaq 100)', type: 'ETF' },
  { symbol: 'DIA', name: 'SPDR Dow Jones Industrial Average ETF', type: 'ETF' },
  { symbol: 'IWM', name: 'iShares Russell 2000 ETF', type: 'ETF' },
  { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', type: 'ETF' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'ETF' },
  { symbol: 'IEFA', name: 'iShares Core MSCI EAFE ETF', type: 'ETF' },
  { symbol: 'IEMG', name: 'iShares Core MSCI Emerging Markets ETF', type: 'ETF' },
  { symbol: 'EFA', name: 'iShares MSCI EAFE ETF', type: 'ETF' },
  { symbol: 'VEA', name: 'Vanguard FTSE Developed Markets ETF', type: 'ETF' },
  { symbol: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF', type: 'ETF' },
  { symbol: 'IJH', name: 'iShares Core S&P Mid-Cap ETF', type: 'ETF' },
  
  // Major Cryptocurrencies
  { symbol: 'BTC-USD', name: 'Bitcoin', type: 'Crypto' },
  { symbol: 'ETH-USD', name: 'Ethereum', type: 'Crypto' },
  { symbol: 'BNB-USD', name: 'Binance Coin', type: 'Crypto' },
  { symbol: 'SOL-USD', name: 'Solana', type: 'Crypto' },
  { symbol: 'XRP-USD', name: 'XRP (Ripple)', type: 'Crypto' },
  { symbol: 'ADA-USD', name: 'Cardano', type: 'Crypto' },
  { symbol: 'AVAX-USD', name: 'Avalanche', type: 'Crypto' },
  { symbol: 'DOGE-USD', name: 'Dogecoin', type: 'Crypto' },
  { symbol: 'DOT-USD', name: 'Polkadot', type: 'Crypto' },
  { symbol: 'SHIB-USD', name: 'Shiba Inu', type: 'Crypto' },
  { symbol: 'MATIC-USD', name: 'Polygon', type: 'Crypto' },
  { symbol: 'LTC-USD', name: 'Litecoin', type: 'Crypto' },
  
  // Popular Tech Stocks
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'Stock' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Stock' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. (Google)', type: 'Stock' },
  { symbol: 'GOOG', name: 'Alphabet Inc. Class C', type: 'Stock' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'Stock' },
  { symbol: 'META', name: 'Meta Platforms Inc. (Facebook)', type: 'Stock' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'Stock' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'Stock' },
  { symbol: 'AMD', name: 'Advanced Micro Devices, Inc.', type: 'Stock' },
  { symbol: 'NFLX', name: 'Netflix, Inc.', type: 'Stock' },
  { symbol: 'INTC', name: 'Intel Corporation', type: 'Stock' },
  { symbol: 'CRM', name: 'Salesforce, Inc.', type: 'Stock' },
  
  // Financial Stocks
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'Stock' },
  { symbol: 'BAC', name: 'Bank of America Corporation', type: 'Stock' },
  { symbol: 'WFC', name: 'Wells Fargo & Company', type: 'Stock' },
  { symbol: 'GS', name: 'Goldman Sachs Group Inc.', type: 'Stock' },
  { symbol: 'MS', name: 'Morgan Stanley', type: 'Stock' },
  { symbol: 'C', name: 'Citigroup Inc.', type: 'Stock' },
  { symbol: 'BLK', name: 'BlackRock, Inc.', type: 'Stock' },
  { symbol: 'AXP', name: 'American Express Company', type: 'Stock' },
  
  // Healthcare Stocks
  { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'Stock' },
  { symbol: 'UNH', name: 'UnitedHealth Group Incorporated', type: 'Stock' },
  { symbol: 'PFE', name: 'Pfizer Inc.', type: 'Stock' },
  { symbol: 'ABT', name: 'Abbott Laboratories', type: 'Stock' },
  { symbol: 'MRK', name: 'Merck & Co., Inc.', type: 'Stock' },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific Inc.', type: 'Stock' },
  
  // Consumer Stocks
  { symbol: 'PG', name: 'Procter & Gamble Company', type: 'Stock' },
  { symbol: 'KO', name: 'Coca-Cola Company', type: 'Stock' },
  { symbol: 'PEP', name: 'PepsiCo, Inc.', type: 'Stock' },
  { symbol: 'COST', name: 'Costco Wholesale Corporation', type: 'Stock' },
  { symbol: 'WMT', name: 'Walmart Inc.', type: 'Stock' },
  { symbol: 'HD', name: 'Home Depot, Inc.', type: 'Stock' },
  { symbol: 'MCD', name: 'McDonald\'s Corporation', type: 'Stock' },
  { symbol: 'NKE', name: 'NIKE, Inc.', type: 'Stock' },
  
  // Energy Stocks
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', type: 'Stock' },
  { symbol: 'CVX', name: 'Chevron Corporation', type: 'Stock' },
  { symbol: 'COP', name: 'ConocoPhillips', type: 'Stock' },
  { symbol: 'SLB', name: 'Schlumberger Limited', type: 'Stock' },
  
  // Bond ETFs
  { symbol: 'AGG', name: 'iShares Core U.S. Aggregate Bond ETF', type: 'Bond' },
  { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', type: 'Bond' },
  { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', type: 'Bond' },
  { symbol: 'LQD', name: 'iShares iBoxx $ Investment Grade Corporate Bond ETF', type: 'Bond' },
  { symbol: 'MUB', name: 'iShares National Muni Bond ETF', type: 'Bond' },
  { symbol: 'VCIT', name: 'Vanguard Intermediate-Term Corporate Bond ETF', type: 'Bond' },
  { symbol: 'VCSH', name: 'Vanguard Short-Term Corporate Bond ETF', type: 'Bond' },
  { symbol: 'HYG', name: 'iShares iBoxx $ High Yield Corporate Bond ETF', type: 'Bond' },
  { symbol: 'JNK', name: 'SPDR Bloomberg High Yield Bond ETF', type: 'Bond' },
  { symbol: 'GOVT', name: 'iShares U.S. Treasury Bond ETF', type: 'Bond' },
  { symbol: 'IGIB', name: 'iShares Intermediate-Term Corporate Bond ETF', type: 'Bond' },
  { symbol: 'USIG', name: 'iShares Broad USD Investment Grade Corporate Bond ETF', type: 'Bond' },
  
  // Real Estate ETFs and REITs
  { symbol: 'VNQ', name: 'Vanguard Real Estate ETF', type: 'Real Estate' },
  { symbol: 'IYR', name: 'iShares U.S. Real Estate ETF', type: 'Real Estate' },
  { symbol: 'SCHH', name: 'Schwab U.S. REIT ETF', type: 'Real Estate' },
  { symbol: 'XLRE', name: 'Real Estate Select Sector SPDR Fund', type: 'Real Estate' },
  { symbol: 'SPG', name: 'Simon Property Group, Inc.', type: 'Real Estate' },
  { symbol: 'PLD', name: 'Prologis, Inc.', type: 'Real Estate' },
  { symbol: 'AMT', name: 'American Tower Corporation', type: 'Real Estate' },
  { symbol: 'CCI', name: 'Crown Castle Inc.', type: 'Real Estate' },
  { symbol: 'EQIX', name: 'Equinix, Inc.', type: 'Real Estate' },
  { symbol: 'PSA', name: 'Public Storage', type: 'Real Estate' },
  { symbol: 'O', name: 'Realty Income Corporation', type: 'Real Estate' },
  { symbol: 'DLR', name: 'Digital Realty Trust, Inc.', type: 'Real Estate' },
  
  // Commodity ETFs
  { symbol: 'GLD', name: 'SPDR Gold Shares', type: 'Commodity' },
  { symbol: 'IAU', name: 'iShares Gold Trust', type: 'Commodity' },
  { symbol: 'SLV', name: 'iShares Silver Trust', type: 'Commodity' },
  { symbol: 'USO', name: 'United States Oil Fund', type: 'Commodity' },
  { symbol: 'DBC', name: 'Invesco DB Commodity Index Tracking Fund', type: 'Commodity' },
  { symbol: 'GSG', name: 'iShares S&P GSCI Commodity-Indexed Trust', type: 'Commodity' },
  { symbol: 'PDBC', name: 'Invesco Optimum Yield Diversified Commodity Strategy No K-1 ETF', type: 'Commodity' },
  { symbol: 'USCI', name: 'United States Commodity Index Fund', type: 'Commodity' }
];

/**
 * Get market data for the default ticker symbols
 */
export async function getMarketData(): Promise<MarketTickerItem[]> {
  try {
    const tickerData: MarketTickerItem[] = [];
    
    // Fetch each symbol individually
    for (const symbol of TICKER_SYMBOLS) {
      try {
        const result = await yahooFinance.quoteSummary(symbol, {
          modules: ['price']
        });
        
        // Log the structure to debug
        console.log(`Data received for ${symbol}:`, JSON.stringify(result?.price || {}, null, 2));
        
        const priceData = result?.price;
        if (priceData) {
          const item: MarketTickerItem = {
            symbol: typeof priceData.symbol === 'string' ? priceData.symbol : symbol,
            price: typeof priceData.regularMarketPrice === 'number' ? priceData.regularMarketPrice : 0,
            change: typeof priceData.regularMarketChange === 'number' ? priceData.regularMarketChange : 0,
            changePercent: typeof priceData.regularMarketChangePercent === 'number' ? priceData.regularMarketChangePercent : 0,
          };
          tickerData.push(item);
        }
      } catch (symbolError) {
        console.error(`Error fetching data for ${symbol}:`, symbolError);
        // Continue with other symbols
      }
    }
    
    return tickerData;
  } catch (error) {
    console.error('Error fetching market data from Yahoo Finance:', error);
    // Return empty array on error
    return [];
  }
}

/**
 * Search for assets by symbol or name
 * @param query The search query (symbol or name)
 * @param limit Maximum number of results to return
 */
export async function searchAssets(query: string, limit: number = 10): Promise<AssetSearchResult[]> {
  try {
    if (!query || query.length < 2) {
      // Return popular assets if query is too short
      return POPULAR_ASSETS.slice(0, limit);
    }
    
    // First check if any popular assets match the query to avoid API calls
    const queryLower = query.toLowerCase();
    const popularMatches = POPULAR_ASSETS.filter(asset => 
      asset.symbol.toLowerCase().includes(queryLower) || 
      asset.name.toLowerCase().includes(queryLower)
    ).slice(0, limit);
    
    // If we have enough popular matches, return them
    if (popularMatches.length >= 5) {
      return popularMatches;
    }
    
    // Otherwise, try to search via Yahoo Finance API
    try {
      const results = await yahooFinance.search(query, {
        quotesCount: limit,
        newsCount: 0,
        enableFuzzyQuery: true,
        enableNavLinks: false,
        enableEnhancedTrivialQuery: true
      });
      
      if (results?.quotes?.length) {
        // Format the results
        const apiResults: AssetSearchResult[] = results.quotes.map(quote => ({
          symbol: (quote as any).symbol || "",
          name: (quote as any).shortname || (quote as any).longname || "",
          exchange: (quote as any).exchange || "",
          type: mapYahooTypeToAssetType((quote as any).quoteType || ""),
          price: (quote as any).regularMarketPrice || undefined
        })).filter(result => result.symbol && result.name); // Filter out items without symbol or name
        
        // Combine with popular matches, removing duplicates
        const allResults = [...popularMatches];
        
        // Add API results that aren't already in popular matches
        for (const apiResult of apiResults) {
          if (!allResults.some(item => item.symbol === apiResult.symbol)) {
            allResults.push(apiResult);
          }
        }
        
        return allResults.slice(0, limit);
      }
    } catch (apiError) {
      console.error('Error searching assets via Yahoo Finance:', apiError);
      // Fall back to popular assets if API fails
    }
    
    // Return popular matches if API call fails or returns no results
    return popularMatches;
  } catch (error) {
    console.error('Error in searchAssets:', error);
    return POPULAR_ASSETS.slice(0, limit);
  }
}

/**
 * Get detailed information for a specific asset by symbol
 * @param symbol The asset symbol to look up
 */
export async function getAssetDetails(symbol: string): Promise<AssetSearchResult | null> {
  try {
    // First check popular assets
    const popularAsset = POPULAR_ASSETS.find(asset => asset.symbol === symbol);
    if (popularAsset) {
      // Try to enrich with price data
      try {
        const result = await yahooFinance.quoteSummary(symbol, {
          modules: ['price']
        });
        
        if (result?.price?.regularMarketPrice) {
          return {
            ...popularAsset,
            price: result.price.regularMarketPrice as number
          };
        }
      } catch (priceError) {
        console.error(`Error fetching price for ${symbol}:`, priceError);
        // Return the popular asset without price if API fails
        return popularAsset;
      }
    }
    
    // If not in popular assets, fetch from API
    try {
      const result = await yahooFinance.quoteSummary(symbol, {
        modules: ['price']
      });
      
      if (result?.price) {
        return {
          symbol: result.price.symbol as string || symbol,
          name: (result.price.shortName as string) || (result.price.longName as string) || symbol,
          exchange: result.price.exchangeName as string || undefined,
          type: mapYahooTypeToAssetType(result.price.quoteType as string || ""),
          price: result.price.regularMarketPrice as number || undefined
        };
      }
    } catch (apiError) {
      console.error(`Error fetching asset details for ${symbol}:`, apiError);
    }
    
    // If we get here, create a basic result with just the symbol
    return {
      symbol,
      name: symbol,
      type: guessAssetType(symbol)
    };
  } catch (error) {
    console.error(`Error in getAssetDetails for ${symbol}:`, error);
    return null;
  }
}

/**
 * Map Yahoo Finance quote type to our asset type
 */
function mapYahooTypeToAssetType(quoteType: string): string {
  switch (quoteType.toLowerCase()) {
    case 'equity':
    case 'option':
      return 'Stock';
    case 'etf':
      return 'ETF';
    case 'cryptocurrency':
      return 'Crypto';
    case 'bond':
    case 'future':
      return 'Bond';
    case 'mutualfund':
      return 'ETF'; // Technically not correct but closest match
    case 'currency':
      return 'Cash';
    case 'index':
      return 'ETF'; // Index funds are typically ETFs
    default:
      return 'Other';
  }
}

/**
 * Guess asset type based on symbol pattern
 */
function guessAssetType(symbol: string): string {
  if (symbol.includes('-USD')) {
    return 'Crypto';
  } else if (symbol.startsWith('^')) {
    return 'ETF'; // Index
  } else if (symbol.length <= 5 && /^[A-Z]+$/.test(symbol)) {
    return 'Stock'; // Standard stock symbols
  } else {
    return 'Other';
  }
}