# Para aprender más sobre cómo usar Nix para configurar tu entorno en IDX
# visita: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Canal de paquetes de Nix
  channel = "stable-23.11"; 

  # Paquetes de software que estarán disponibles en tu terminal de IDX
  packages = [
    pkgs.nodejs_20
    pkgs.nodePackages.pnpm
    pkgs.supabase-cli
    pkgs.watchman # Necesario para React Native / Expo
  ];

  # Configuración específica de Project IDX
  idx = {
    # Extensiones de VS Code que se instalarán automáticamente
    extensions = [
      "bradlc.vscode-tailwindcss"
      "esbenp.prettier-vscode"
      "dbaeumer.vscode-eslint"
      "expo.vscode-expo-tools"
      "dsznajder.es7-react-js-snippets"
      "humao.rest-client"
      "eamodio.gitlens"
      "prisma.prisma" # Solo si decides usar Prisma con Supabase
    ];

    # Configuración de previsualización (Web y Android)
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["pnpm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
          manager = "web";
        };
        # IDX permite previsualizar Android si el proyecto es compatible
        # android = {
        #   manager = "android";
        # };
      };
    };

    # Hooks que se ejecutan al crear o abrir el espacio de trabajo
    onCreate = {
      # Instalar dependencias automáticamente al crear el workspace
      install-dependencies = "pnpm install";
    };
  };
}